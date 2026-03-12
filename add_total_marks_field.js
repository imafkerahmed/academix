const PocketBase = require("pocketbase/cjs");
const pb = new PocketBase("http://127.0.0.1:8090");

async function migrate() {
  try {
    const adminEmail =
      process.env.POCKETBASE_ADMIN_EMAIL || "imafkerahmed@gmail.com";
    const adminPassword =
      process.env.POCKETBASE_ADMIN_PASSWORD || 'xsj>~6"Gn2tzeFz';
    await pb.admins.authWithPassword(adminEmail, adminPassword);

    const collection = await pb.collections.getOne("assignments");

    // Check if total_marks already exists
    const hasTotalMarks = collection.fields.some(f => f.name === "total_marks");

    if (!hasTotalMarks) {
      collection.fields.push({
        hidden: false,
        id: "number_total_marks",
        name: "total_marks",
        onlyInt: true,
        presentable: false,
        required: false,
        system: false,
        type: "number"
      });

      await pb.collections.update("assignments", { fields: collection.fields });
      console.log("Successfully added total_marks field to assignments collection.");
    } else {
      console.log("Field 'total_marks' already exists.");
    }
  } catch (err) {
    console.error("Migration failed:", err.message);
    if (err.data && err.data.data)
      console.error(JSON.stringify(err.data.data, null, 2));
  }
}

migrate();
