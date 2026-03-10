const PocketBase = require("pocketbase/cjs");
const pb = new PocketBase("http://127.0.0.1:8090");

async function migrate() {
  try {
    const adminEmail =
      process.env.POCKETBASE_ADMIN_EMAIL || "imafkerahmed@gmail.com";
    const adminPassword =
      process.env.POCKETBASE_ADMIN_PASSWORD || 'xsj>~6"Gn2tzeFz';
    await pb.admins.authWithPassword(adminEmail, adminPassword);

    // 1. Fetch the classes collection
    const collection = await pb.collections.getOne("classes");

    // 2. Find the course_subject field via collection.fields
    let modified = false;

    if (Array.isArray(collection.fields)) {
      for (const field of collection.fields) {
        if (field.name === "course_subject") {
          // Change maxSelect to null for infinite selections (array output)
          field.maxSelect = null;
          console.log(
            "Updated course_subject maxSelect to null in fields array",
          );
          modified = true;
        }
      }
    } else {
      console.log("fields was not an array:", typeof collection.fields);
    }

    // 3. Update the collection
    if (modified) {
      await pb.collections.update("classes", { fields: collection.fields });
      console.log(
        "Successfully migrated classes collection. course_subject is now an array.",
      );
    } else {
      console.log("Field 'course_subject' not found or not modified.");
    }
  } catch (err) {
    console.error("Migration failed:", err.message);
    if (err.data && err.data.data)
      console.error(JSON.stringify(err.data.data, null, 2));
  }
}

migrate();
