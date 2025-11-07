const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const auth = require('../middleware/authMiddleware');
const Prediction = require('../models/Prediction');

const pythonBinary = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

// Disease guidance map matching your Python model's 38 classes
const guidance = {
  'Apple___Apple_scab': {
    description: 'Fungal disease causing dark, scabby lesions on leaves and fruit.',
    suggestions: ['Remove infected leaves', 'Apply fungicide', 'Improve air circulation']
  },
  'Apple___Black_rot': {
    description: 'Fungal disease causing leaf spots and fruit rot.',
    suggestions: ['Prune infected branches', 'Apply appropriate fungicide', 'Remove mummified fruit']
  },
  'Apple___Cedar_apple_rust': {
    description: 'Fungal disease causing orange spots on leaves.',
    suggestions: ['Remove nearby cedar trees if possible', 'Apply fungicide in spring', 'Use resistant varieties']
  },
  'Apple___healthy': {
    description: 'Leaf appears healthy with no signs of disease.',
    suggestions: ['Maintain proper watering', 'Continue regular monitoring']
  },
  'Blueberry___healthy': {
    description: 'Blueberry leaf is healthy.',
    suggestions: ['Continue proper care']
  },
  'Cherry_(including_sour)___Powdery_mildew': {
    description: 'Fungal disease causing white powdery spots on leaves.',
    suggestions: ['Remove infected leaves', 'Improve air circulation', 'Apply sulfur-based fungicide']
  },
  'Cherry_(including_sour)___healthy': {
    description: 'Leaf appears healthy.',
    suggestions: ['Continue good care practices']
  },
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
    description: 'Fungal disease causing gray leaf spots.',
    suggestions: ['Rotate crops', 'Use resistant varieties', 'Apply fungicide if severe']
  },
  'Corn_(maize)___Common_rust_': {
    description: 'Fungal disease with reddish-brown pustules.',
    suggestions: ['Plant resistant hybrids', 'Apply fungicide if necessary']
  },
  'Corn_(maize)___Northern_Leaf_Blight': {
    description: 'Fungal disease causing long gray-green lesions.',
    suggestions: ['Use resistant varieties', 'Rotate crops', 'Remove crop debris']
  },
  'Corn_(maize)___healthy': {
    description: 'Corn leaf is healthy.',
    suggestions: ['Maintain proper nutrition and watering']
  },
  'Grape___Black_rot': {
    description: 'Fungal disease causing black spots and fruit rot.',
    suggestions: ['Remove infected fruit', 'Apply fungicide', 'Prune for air circulation']
  },
  'Grape___Esca_(Black_Measles)': {
    description: 'Fungal disease causing leaf discoloration and wood decay.',
    suggestions: ['Remove infected wood', 'No cure available - manage symptoms', 'Avoid stress to vines']
  },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
    description: 'Fungal disease with dark leaf spots.',
    suggestions: ['Apply copper fungicide', 'Remove infected leaves', 'Improve drainage']
  },
  'Grape___healthy': {
    description: 'Grape leaf is healthy.',
    suggestions: ['Continue regular care']
  },
  'Orange___Haunglongbing_(Citrus_greening)': {
    description: 'Bacterial disease causing yellow shoots and misshapen fruit.',
    suggestions: ['Remove infected trees', 'Control psyllid insects', 'Use certified disease-free plants']
  },
  'Peach___Bacterial_spot': {
    description: 'Bacterial disease causing dark spots on leaves and fruit.',
    suggestions: ['Use copper sprays', 'Plant resistant varieties', 'Avoid overhead irrigation']
  },
  'Peach___healthy': {
    description: 'Peach leaf is healthy.',
    suggestions: ['Maintain good practices']
  },
  'Pepper,_bell___Bacterial_spot': {
    description: 'Bacterial disease with dark leaf spots.',
    suggestions: ['Use disease-free seeds', 'Apply copper bactericide', 'Rotate crops']
  },
  'Pepper,_bell___healthy': {
    description: 'Pepper leaf is healthy.',
    suggestions: ['Continue proper care']
  },
  'Potato___Early_blight': {
    description: 'Fungal disease with concentric ring patterns on leaves.',
    suggestions: ['Apply fungicide', 'Remove infected leaves', 'Rotate crops']
  },
  'Potato___Late_blight': {
    description: 'Serious fungal disease causing rapid leaf death.',
    suggestions: ['Apply fungicide immediately', 'Remove infected plants', 'Improve air circulation']
  },
  'Potato___healthy': {
    description: 'Potato leaf is healthy.',
    suggestions: ['Monitor regularly', 'Maintain proper care']
  },
  'Raspberry___healthy': {
    description: 'Raspberry leaf is healthy.',
    suggestions: ['Continue regular care']
  },
  'Soybean___healthy': {
    description: 'Soybean leaf is healthy.',
    suggestions: ['Maintain good practices']
  },
  'Squash___Powdery_mildew': {
    description: 'Fungal disease with white powdery coating.',
    suggestions: ['Apply fungicide', 'Improve air circulation', 'Remove infected leaves']
  },
  'Strawberry___Leaf_scorch': {
    description: 'Fungal disease causing leaf edges to brown.',
    suggestions: ['Remove infected leaves', 'Apply fungicide', 'Improve drainage']
  },
  'Strawberry___healthy': {
    description: 'Strawberry leaf is healthy.',
    suggestions: ['Maintain proper care']
  },
  'Tomato___Bacterial_spot': {
    description: 'Bacterial disease causing dark spots.',
    suggestions: ['Use resistant varieties', 'Apply copper spray', 'Avoid overhead watering']
  },
  'Tomato___Early_blight': {
    description: 'Fungal disease with target-like spots.',
    suggestions: ['Remove affected leaves', 'Apply fungicide', 'Mulch to prevent soil splash']
  },
  'Tomato___Late_blight': {
    description: 'Devastating fungal disease.',
    suggestions: ['Apply fungicide', 'Remove infected plants', 'Ensure good air flow']
  },
  'Tomato___Leaf_Mold': {
    description: 'Fungal disease causing yellowing and mold.',
    suggestions: ['Reduce humidity', 'Improve ventilation', 'Apply fungicide']
  },
  'Tomato___Septoria_leaf_spot': {
    description: 'Fungal disease with circular spots.',
    suggestions: ['Remove infected leaves', 'Apply fungicide', 'Avoid wetting foliage']
  },
  'Tomato___Spider_mites Two-spotted_spider_mite': {
    description: 'Pest damage causing stippling and webbing.',
    suggestions: ['Spray with water', 'Use insecticidal soap', 'Introduce predatory mites']
  },
  'Tomato___Target_Spot': {
    description: 'Fungal disease with concentric ring spots.',
    suggestions: ['Apply fungicide', 'Remove infected leaves', 'Improve air circulation']
  },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    description: 'Viral disease causing leaf curling and yellowing.',
    suggestions: ['Control whitefly vectors', 'Remove infected plants', 'Use resistant varieties']
  },
  'Tomato___Tomato_mosaic_virus': {
    description: 'Viral disease causing mottled leaves.',
    suggestions: ['Remove infected plants', 'Sanitize tools', 'Use resistant varieties']
  },
  'Tomato___healthy': {
    description: 'Tomato leaf is healthy.',
    suggestions: ['Continue good practices', 'Monitor regularly']
  }
};

// POST /api/predict
router.post('/', auth, async (req, res) => {
  try {
    const { imageUrl } = req.body || {};
    
    console.log('📥 Received prediction request:', { imageUrl, userId: req.user?.id });
    
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
      return res.status(400).json({ message: 'Invalid or missing imageUrl' });
    }

    const absPath = path.join(__dirname, '..', imageUrl);
    
    // Check if file exists
    if (!fs.existsSync(absPath)) {
      console.error('❌ File not found:', absPath);
      return res.status(404).json({ message: 'Image file not found' });
    }

    console.log('🐍 Running Python prediction on:', absPath);

    // Run Python script
    const pyPath = path.join(__dirname, '..', 'model', 'predict.py');
    const py = spawn(pythonBinary, [pyPath, '--image', absPath]);

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    py.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    py.on('close', async (code) => {
      if (code !== 0) {
        console.error('❌ Python error (exit code ' + code + '):', stderr);
        return res.status(500).json({ 
          message: 'Prediction failed', 
          error: stderr || 'Python script exited with error' 
        });
      }

      let result;
      try {
        console.log('📤 Python output:', stdout);
        result = JSON.parse(stdout);
      } catch (e) {
        console.error('❌ Invalid JSON from Python:', stdout);
        return res.status(500).json({ message: 'Invalid response from model' });
      }

      const diseaseName = result.disease || 'Unknown';
      const confidence = typeof result.confidence === 'number' ? result.confidence : 0;

      const meta = guidance[diseaseName] || {
        description: 'No description available.',
        suggestions: ['Consult agronomy resources for treatment.']
      };

      // Save prediction to database
      try {
        const pred = await Prediction.create({
          userId: req.user.id,
          imageUrl,
          diseaseName,
          confidence
        });

        console.log('✅ Prediction saved:', pred._id);

        return res.json({
          id: pred._id,
          imageUrl,
          disease: diseaseName,
          confidence,
          description: meta.description,
          suggestions: meta.suggestions
        });
      } catch (dbError) {
        console.error('⚠️ Database save failed:', dbError.message);
        // Still return prediction even if DB save fails
        return res.json({
          imageUrl,
          disease: diseaseName,
          confidence,
          description: meta.description,
          suggestions: meta.suggestions,
          warning: 'Prediction not saved to database'
        });
      }
    });
  } catch (err) {
    console.error('❌ Predict route error:', err);
    return res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
});

module.exports = router;