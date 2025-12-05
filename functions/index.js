
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Deletes guest accounts that are older than 24 hours.
 *
 * This function is scheduled to run every 24 hours.
 */
exports.cleanupGuestAccounts = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      // Get all guest users created more than 24 hours ago
      const usersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("isGuest", "==", true)
        .where("createdAt", "<", twentyFourHoursAgo)
        .get();

      if (usersSnapshot.empty) {
        console.log("No old guest accounts to delete.");
        return null;
      }

      const batch = admin.firestore().batch();
      const userIdsToDelete = [];

      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        console.log(`Preparing to delete user: ${user.uid}`);
        userIdsToDelete.push(user.uid);
        batch.delete(doc.ref);
      });

      // Delete the documents from Firestore
      await batch.commit();
      console.log(`Successfully deleted ${userIdsToDelete.length} user document(s) from Firestore.`);

      // Delete the users from Firebase Authentication
      // Auth deletions must be done in series or with managed concurrency to avoid overwhelming the API
      for (const uid of userIdsToDelete) {
          try {
              await admin.auth().deleteUser(uid);
              console.log(`Successfully deleted user with UID: ${uid} from Auth.`);
          } catch (error) {
              console.error(`Error deleting user with UID: ${uid} from Auth:`, error);
          }
      }

      return { message: `Cleanup complete. Deleted ${userIdsToDelete.length} guest accounts.` };

    } catch (error) {
      console.error("Error cleaning up guest accounts:", error);
      return null;
    }
  });
