"use client";
import { ChartContainer } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function AssignmentCompletionChart() {
  // Example data
  const data = [
    { name: "2024A", value: 80, color: "#2563eb" },
    { name: "2024B", value: 75, color: "#22d3ee" },
    { name: "2025A", value: 90, color: "#a21caf" },
    { name: "2025B", value: 70, color: "#f59e42" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Completion</CardTitle>
        <CardDescription>Completion % by intake</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] w-full">
          <ChartContainer
            config={Object.fromEntries(
              data.map((d) => [d.name, { color: d.color }]),
            )}
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} barSize={32} style={{ fontSize: 12 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "#f3f4f6" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
