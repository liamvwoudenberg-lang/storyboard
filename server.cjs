const express = require('express');
const cors = require('cors');
const { admin } = require('./firebaseAdmin.cjs');

const app = express();
app.use(cors());
app.use(express.json());

const db = admin.firestore();

app.post('/generate-share-link', async (req, res) => {
  const { v4: uuidv4 } = await import('uuid');
  const { projectId, permission } = req.body;

  if (!projectId || !permission) {
    return res.status(400).send('Missing projectId or permission.');
  }

  if (!['editor', 'viewer'].includes(permission)) {
    return res.status(400).send('Invalid permission level.');
  }

  try {
    const shareId = uuidv4();
    const projectRef = db.collection('storyboards').doc(projectId);

    await projectRef.update({
      [`shareLinks.${shareId}`]: permission
    });

    res.status(200).json({ shareId });
  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/get-project-by-share-link/:shareId', async (req, res) => {
    const { shareId } = req.params;
  
    try {
      const storyboardsRef = db.collection('storyboards');
      const snapshot = await storyboardsRef.where(`shareLinks.${shareId}`, 'in', ['editor', 'viewer']).limit(1).get();
  
      if (snapshot.empty) {
        return res.status(404).send('Project not found.');
      }
  
      let projectData;
      snapshot.forEach(doc => {
        projectData = { id: doc.id, permission: doc.data().shareLinks[shareId] };
      });
  
      res.status(200).json(projectData);
    } catch (error) {
      console.error('Error getting project by share link:', error);
      res.status(500).send('Internal Server Error');
    }
  });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});