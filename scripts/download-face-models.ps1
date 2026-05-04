# Download face-api.js model files to public/models/
# Run from project root: .\scripts\download-face-models.ps1

$modelsDir = "apps\web\public\models"
New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null

$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

$files = @(
  # Tiny Face Detector
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  # Face Landmark 68
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  # Face Recognition
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2"
)

foreach ($file in $files) {
  $dest = Join-Path $modelsDir $file
  if (Test-Path $dest) {
    Write-Host "  [SKIP] $file already exists" -ForegroundColor Yellow
    continue
  }
  Write-Host "  [DL]   $file" -ForegroundColor Cyan
  try {
    Invoke-WebRequest -Uri "$baseUrl/$file" -OutFile $dest -UseBasicParsing
    Write-Host "  [OK]   $file" -ForegroundColor Green
  } catch {
    Write-Host "  [ERR]  Failed to download $file : $_" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Done! Models saved to: $modelsDir" -ForegroundColor Green
