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

export default function PaymentSummaryChart({
  paid,
  pending,
  paidAmount,
  pendingAmount,
}: {
  paid: number;
  pending: number;
  paidAmount: number;
  pendingAmount: number;
}) {
  const data = [
    { name: "Paid", value: paid, color: "#16a34a" },
    { name: "Pending", value: pending, color: "#eab308" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Summary</CardTitle>
        <CardDescription>Overview of paid and pending payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] w-full">
          <ChartContainer
            config={{
              Paid: { color: "#16a34a" },
              Pending: { color: "#eab308" },
            }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} barSize={40} style={{ fontSize: 12 }}>
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
        <div className="flex justify-around mt-4">
          <div className="flex flex-col items-center">
            <span className="text-green-600 font-semibold">Paid</span>
            <span className="text-lg">{paidAmount.toLocaleString()} USD</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-yellow-600 font-semibold">Pending</span>
            <span className="text-lg">
              {pendingAmount.toLocaleString()} USD
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
