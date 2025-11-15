import DistrictDashboard from "@/components/district/DistrictDashboard";

interface Props {
  params: { slug: string };
}

export default function DistrictPage({ params }: Props) {
  return <DistrictDashboard slug={params.slug} />;
}
