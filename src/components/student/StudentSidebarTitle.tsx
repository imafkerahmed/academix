import GradientText from "@/components/ui/GradientText";

export default function StudentSidebarTitle() {
  return (
    <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-center">
      <span className="text-2xl font-extrabold tracking-tight">
        <GradientText
          className="text-2xl md:text-3xl"
          colors={["#7F56D9", "#FF80B5", "#A5B4FC"]}
        >
          ACADEMIX
        </GradientText>
      </span>
    </div>
  );
}
