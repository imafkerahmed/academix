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

    // 2. Add the lecturer field
    // It's a relation to the 'users' collection
    const lecturerField = {
      name: "lecturer",
      type: "relation",
      required: false,
      presentable: false,
      unique: false,
      options: {
        collectionId: "_pb_users_auth_", // Default users collection ID in PB
        cascadeDelete: false,
        minSelect: null,
        maxSelect: 1,
        displayFields: null,
      },
    };

    // Check if it already exists
    const exists = collection.fields.find((f) => f.name === "lecturer");
    if (!exists) {
      collection.fields.push(lecturerField);
      await pb.collections.update("classes", { fields: collection.fields });
      console.log("Successfully added 'lecturer' field to classes collection.");
    } else {
      console.log("'lecturer' field already exists.");
    }
  } catch (err) {
    console.error("Migration failed:", err.message);
    if (err.data && err.data.data)
      console.error(JSON.stringify(err.data.data, null, 2));
  }
}

migrate();
