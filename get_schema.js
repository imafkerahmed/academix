const PocketBase = require("pocketbase/cjs");
const pb = new PocketBase("http://127.0.0.1:8090");

async function run() {
  try {
    await pb.admins.authWithPassword(
      "imafkerahmed@gmail.com",
      'xsj>~6"Gn2tzeFz',
    );
    const assignmentsColl = await pb.collections.getOne("assignments");
    console.log("ASSIGNMENTS SCHEMA:", JSON.stringify(assignmentsColl.fields, null, 2));

    const submissionsColl = await pb.collections.getOne("assignment_submissions");
    console.log("SUBMISSIONS SCHEMA:", JSON.stringify(submissionsColl.fields, null, 2));
  } catch (err) {
    console.error("error:", err.message);
  }
}
run();
