const PocketBase = require("pocketbase/cjs");
const pb = new PocketBase("http://127.0.0.1:8090");

async function run() {
  try {
    await pb.admins.authWithPassword(
      "imafkerahmed@gmail.com",
      'xsj>~6"Gn2tzeFz',
    );
    const classesColl = await pb.collections.getOne("classes");
    console.log("CLASSES KEYS:", Object.keys(classesColl));
    console.log(
      "CLASSES SCHEMA/FIELDS:",
      classesColl.schema || classesColl.fields,
    );
  } catch (err) {
    console.error("error:", err.message);
  }
}
run();
