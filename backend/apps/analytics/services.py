from __future__ import annotations

import math
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from django.conf import settings
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, IsolationForest, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .models import AnalyticsSnapshot

NUMERIC_COLUMNS = ["Hour", "Day", "Week_num", "Year"]
CATEGORICAL_COLUMNS = [
    "District",
    "Beats",
    "Crime_Category",
    "Day_char",
    "Month",
    "Year_Month",
]
TARGET_COLUMN = "Violent_Crime_excl09A"


def _load_default_dataframe() -> pd.DataFrame:
    return pd.read_excel(settings.DATASET_PATH)


def prepare_dataframe(df: pd.DataFrame, district_name: str | None = None) -> pd.DataFrame:
    prepared = df.copy()
    if "Date/Time Occurred" in prepared.columns:
        prepared["Date/Time Occurred"] = pd.to_datetime(prepared["Date/Time Occurred"])
        prepared["Weekday"] = prepared["Date/Time Occurred"].dt.day_name()
        prepared["Quarter"] = prepared["Date/Time Occurred"].dt.quarter
    if "District" in prepared.columns and district_name:
        prepared = prepared[
            prepared["District"].str.upper()
            == district_name.upper()
        ]
    prepared["target_binary"] = (
        prepared[TARGET_COLUMN]
        .fillna("NonViolent")
        .astype(str)
        .str.lower()
        .isin(["violent", "true", "1"])
        .astype(int)
    )
    return prepared


def describe_column(series: pd.Series) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "dtype": str(series.dtype),
        "non_null": int(series.notna().sum()),
        "null_pct": float(series.isna().mean()) * 100,
        "unique": int(series.nunique(dropna=True)),
    }
    if pd.api.types.is_numeric_dtype(series):
        result["stats"] = {
            "mean": float(series.mean()),
            "std": float(series.std()),
            "min": float(series.min()),
            "max": float(series.max()),
            "q25": float(series.quantile(0.25)),
            "median": float(series.median()),
            "q75": float(series.quantile(0.75)),
        }
        counts, bins = np.histogram(series.dropna(), bins=15)
        result["histogram"] = {
            "bins": bins.round(2).tolist(),
            "counts": counts.tolist(),
        }
    else:
        top = series.value_counts(dropna=False).head(15)
        result["top_values"] = [
            {"label": str(idx), "count": int(val)} for idx, val in top.items()
        ]
    return result


def compute_eda_payload(df: pd.DataFrame) -> Dict[str, Any]:
    payload: Dict[str, Any] = {}
    for column in df.columns:
        payload[column] = describe_column(df[column])
    return payload


def compute_multivariate_payload(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_cols = [col for col in NUMERIC_COLUMNS if col in df.columns]
    corr_matrix = df[numeric_cols].corr().fillna(0) if numeric_cols else pd.DataFrame()
    by_month = (
        df.groupby("Year_Month")
        .size()
        .reset_index(name="count")
        .sort_values("Year_Month")
        .to_dict(orient="records")
        if "Year_Month" in df.columns
        else []
    )
    by_hour_category = (
        df.pivot_table(
            index="Hour",
            columns="Crime_Category",
            values="Case Number",
            aggfunc="count",
            fill_value=0,
        )
        .reset_index()
        .to_dict(orient="records")
        if {"Hour", "Crime_Category", "Case Number"} <= set(df.columns)
        else []
    )
    beat_weekday = (
        df.pivot_table(
            index="Beats",
            columns="Day_char",
            values="Case Number",
            aggfunc="count",
            fill_value=0,
        )
        .reset_index()
        .to_dict(orient="records")
        if {"Beats", "Day_char", "Case Number"} <= set(df.columns)
        else []
    )
    return {
        "correlations": corr_matrix.reset_index().to_dict(orient="records")
        if not corr_matrix.empty
        else [],
        "monthly_counts": by_month,
        "hourly_breakdown": by_hour_category,
        "beat_vs_weekday": beat_weekday,
    }


def _build_preprocessor(df: pd.DataFrame):
    categorical = [col for col in CATEGORICAL_COLUMNS + ["Weekday"] if col in df.columns]
    numeric = [col for col in NUMERIC_COLUMNS if col in df.columns]
    return ColumnTransformer(
        transformers=[
            (
                "cat",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
                    ]
                ),
                categorical,
            ),
            (
                "num",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                numeric,
            ),
        ]
    )


def _get_feature_names(preprocessor: ColumnTransformer) -> List[str]:
    feature_names: List[str] = []
    if "cat" in preprocessor.named_transformers_:
        encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
        categorical_features = preprocessor.transformers_[0][2]
        feature_names.extend(encoder.get_feature_names_out(categorical_features).tolist())
    if "num" in preprocessor.named_transformers_:
        feature_names.extend(preprocessor.transformers_[1][2])
    return feature_names


def _fit_model(
    name: str,
    estimator,
    tuned: bool,
    X_train,
    X_val,
    X_test,
    y_train,
    y_val,
    y_test,
    preprocessor,
) -> Dict[str, Any]:
    pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", estimator)])
    pipeline.fit(X_train, y_train)
    results = {
        "name": name,
        "tuned": tuned,
        "parameters": estimator.get_params(),
    }

    def evaluate(split_name, X, y):
        preds = pipeline.predict(X)
        metrics = {
            "accuracy": float(accuracy_score(y, preds)),
            "precision": float(precision_score(y, preds, zero_division=0)),
            "recall": float(recall_score(y, preds, zero_division=0)),
            "f1": float(f1_score(y, preds, zero_division=0)),
        }
        if hasattr(pipeline, "predict_proba"):
            try:
                probas = pipeline.predict_proba(X)[:, 1]
                metrics["roc_auc"] = float(roc_auc_score(y, probas))
            except ValueError:
                metrics["roc_auc"] = math.nan
        return metrics

    results["metrics"] = {
        "validation": evaluate("validation", X_val, y_val),
        "test": evaluate("test", X_test, y_test),
    }

    feature_importances: List[Dict[str, Any]] = []
    feature_names = _get_feature_names(pipeline.named_steps["preprocessor"])
    model = pipeline.named_steps["model"]
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        feature_importances = [
            {"feature": feature_names[idx], "importance": float(score)}
            for idx, score in enumerate(importances)
        ]
    elif hasattr(model, "coef_"):
        coefs = model.coef_[0]
        feature_importances = [
            {"feature": feature_names[idx], "importance": float(coefs[idx])}
            for idx in range(len(feature_names))
        ]
    results["feature_importances"] = sorted(
        feature_importances, key=lambda item: abs(item["importance"]), reverse=True
    )[:25]

    return results


def train_models(df: pd.DataFrame) -> Dict[str, Any]:
    if TARGET_COLUMN not in df.columns:
        return {"detail": "target column missing"}
    filtered = df.copy()
    y = filtered["target_binary"]
    feature_cols = list(
        set(NUMERIC_COLUMNS + CATEGORICAL_COLUMNS + ["Weekday"])
        & set(filtered.columns)
    )
    X = filtered[feature_cols]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if y.nunique() > 1 else None
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train,
        y_train,
        test_size=0.2,
        random_state=42,
        stratify=y_train if y_train.nunique() > 1 else None,
    )
    preprocessor = _build_preprocessor(filtered)

    models = [
        ("Logistic Regression (baseline)", LogisticRegression(max_iter=1000), False),
        (
            "Random Forest (tuned)",
            RandomForestClassifier(
                n_estimators=400,
                max_depth=16,
                class_weight="balanced_subsample",
                random_state=42,
            ),
            True,
        ),
        (
            "Gradient Boosting (tuned)",
            GradientBoostingClassifier(random_state=42),
            True,
        ),
    ]

    model_results = [
        _fit_model(
            name,
            estimator,
            tuned,
            X_train,
            X_val,
            X_test,
            y_train,
            y_val,
            y_test,
            preprocessor,
        )
        for name, estimator, tuned in models
    ]

    return {
        "target": TARGET_COLUMN,
        "feature_columns": feature_cols,
        "split_counts": {
            "train": len(X_train),
            "validation": len(X_val),
            "test": len(X_test),
        },
        "models": model_results,
    }


def detect_anomalies(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_cols = [col for col in ["Hour", "Week_num", "target_binary"] if col in df.columns]
    if len(numeric_cols) < 2:
        return {"anomalies": []}
    features = df[numeric_cols].fillna(0)
    detector = IsolationForest(random_state=42, contamination=0.02)
    detector.fit(features)
    scores = detector.decision_function(features)
    df = df.copy()
    df["anomaly_score"] = scores
    if "Date/Time Occurred" in df.columns:
        df["Date/Time Occurred"] = df["Date/Time Occurred"].astype(str)
    anomalies = (
        df.nsmallest(15, "anomaly_score")[
            ["Case Number", "Date/Time Occurred", "Beats", "Crime_Category", "anomaly_score"]
        ]
        .fillna("")
        .to_dict(orient="records")
        if {"Case Number", "Beats", "Crime_Category"} <= set(df.columns)
        else []
    )
    return {"anomalies": anomalies}


def build_snapshot_for_asset(asset, df: pd.DataFrame | None = None) -> AnalyticsSnapshot:
    if df is None:
        df = _load_default_dataframe()
    prepared = prepare_dataframe(df, district_name=asset.district.name)
    snapshot = AnalyticsSnapshot.objects.create(
        data_asset=asset,
        district=asset.district,
        eda_payload=compute_eda_payload(prepared),
        multivariate_payload=compute_multivariate_payload(prepared),
        ml_payload=train_models(prepared),
        anomalies_payload=detect_anomalies(prepared),
    )
    return snapshot


def latest_snapshot_for_district(district_slug: str) -> AnalyticsSnapshot | None:
    return (
        AnalyticsSnapshot.objects.filter(district__slug=district_slug)
        .order_by("-generated_at")
        .first()
    )
