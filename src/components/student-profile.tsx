import React from "react";
import Image from "next/image";

const statusColors: Record<string, string> = {
  Ongoing: "#4F8BFF",
  Completed: "#4FD18B",
  "Certificate Issued": "#4FD18B",
  "Certificate Not Issued": "#F5A623",
};

type Course = {
  code: string;
  title: string;
  status: "Ongoing" | "Completed";
  certificate: "Issued" | "Not Issued";
};

type StudentProfileProps = {
  name: string;
  role: string;
  imageUrl: string;
  courses: Course[];
};

const StudentProfile: React.FC<StudentProfileProps> = ({
  name,
  role,
  imageUrl,
  courses,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        width: "100%",
        padding: 32,
        boxSizing: "border-box",
        margin: "auto",
        justifyContent: "center",
        height: "100%",
      }}
    >
      {/* Example: Student image and info */}
      <div
        style={{
          marginRight: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Image
          src={imageUrl}
          alt={name}
          width={140}
          height={140}
          style={{ borderRadius: "50%" }}
        />
        <div
          style={{
            fontWeight: 700,
            fontSize: 28,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          {name}
        </div>
        <div style={{ color: "#888", fontSize: 16, marginTop: 4 }}>{role}</div>
      </div>
      {/* Courses List */}
      <div
        style={{
          flex: 1,
          maxHeight: 2 * 110 + 12, // 2 cards (110px each) + 12px gap
          overflowY: "auto",
        }}
      >
        {courses.map((course, idx) => (
          <div
            key={course.code}
            style={{
              marginBottom: 12,
              padding: "10px 18px 10px 18px",
              borderRadius: 16,
              background: "#F8F8F8",
              boxShadow: "none",
              border: "none",
              minWidth: 0,
              width: "100s%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                color: "#A3A3A3",
                fontSize: 13,
                marginBottom: 2,
                wordBreak: "break-all",
                minWidth: 0,
              }}
            >
              {course.code}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: "#222",
                marginBottom: 6,
                wordBreak: "break-word",
                minWidth: 0,
                lineHeight: 1.2,
              }}
            >
              {course.title}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 0,
                alignItems: "center",
                minWidth: 0,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  background:
                    course.status === "Ongoing" ? "#4F8CFF" : "#6EE7B7",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "3px 14px",
                  fontWeight: 600,
                  fontSize: 14,
                  minWidth: 70,
                  textAlign: "center",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flexShrink: 0,
                }}
              >
                {course.status === "Ongoing" ? "Ongoing" : "Completed"}
              </span>
              <span
                style={{
                  background: course.certificate === "Issued" ? "#fff" : "#fff",
                  color:
                    course.certificate === "Issued" ? "#34D399" : "#F59E42",
                  border:
                    course.certificate === "Issued"
                      ? "2px solid #34D399"
                      : "2px solid #F59E42",
                  borderRadius: 12,
                  padding: "3px 14px",
                  fontWeight: 600,
                  fontSize: 14,
                  minWidth: 110,
                  textAlign: "center",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flexShrink: 0,
                }}
              >
                {course.certificate === "Issued"
                  ? "Certificate Issued"
                  : "Certificate Not Issued"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentProfile;
