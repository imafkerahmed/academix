"use client";
import { ChartContainer } from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartLegendContent } from "@/components/ui/chart";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function StudentSummaryChart({
  intakes,
}: {
  intakes: { intake: string; count: number }[];
}) {
  const colors = [
    "#2563eb",
    "#22d3ee",
    "#a21caf",
    "#f59e42",
    "#16a34a",
    "#eab308",
  ];
  const data = intakes.map((i, idx) => ({
    name: i.intake,
    value: i.count,
    color: colors[idx % colors.length],
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Summary</CardTitle>
        <CardDescription>Intake-wise student distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-[250px] w-full flex flex-row items-center gap-4">
          <ChartContainer
            config={Object.fromEntries(
              data.map((d) => [d.name, { color: d.color }]),
            )}
          >
            <div className="flex flex-row items-center w-full gap-4">
              <div
                className="flex-shrink-0 flex flex-col justify-center"
                style={{ minWidth: 120 }}
              >
                <ChartLegendContent
                  payload={data.map((d, i) => ({
                    value: d.name,
                    color: d.color,
                    type: "circle",
                    id: i,
                  }))}
                  verticalAlign="middle"
                />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartContainer>
        </div>
        <div className="min-h-[250px] w-full flex flex-row items-center gap-4">
          <ChartContainer
            config={Object.fromEntries(
              data.map((d) => [d.name, { color: d.color }]),
            )}
          >
            <div className="flex flex-row items-center w-full gap-4">
              <div
                className="flex-shrink-0 flex flex-col justify-center"
                style={{ minWidth: 120 }}
              >
                <ChartLegendContent
                  payload={data.map((d, i) => ({
                    value: d.name,
                    color: d.color,
                    type: "circle",
                    id: i,
                  }))}
                  verticalAlign="middle"
                />
              </div>
              <div
                className="flex-1 flex items-center justify-center"
                style={{ minWidth: 0 }}
              >
                <div style={{ width: "100%", maxWidth: 320 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
