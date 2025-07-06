export default function TestImage() {
  const testParams = {
    score: '1250',
    time: '01:23',
    gameType: 'vertical-jump',
    userImg: 'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=PFP'
  };

  const params = new URLSearchParams(testParams);
  const imageUrl = `/api/og-image?${params.toString()}`;

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>🧪 OG Image Test</h1>
      <p>This is how your generated image will look:</p>
      
      <div style={{ 
        border: '2px solid #ccc', 
        borderRadius: '8px', 
        padding: '10px',
        marginTop: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>Generated Image (1200x630):</h3>
        <img 
          src={imageUrl} 
          alt="Generated OG Image" 
          style={{ 
            width: '100%', 
            maxWidth: '600px', 
            height: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }} 
        />
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Test Parameters:</h4>
        <ul>
          <li><strong>Score:</strong> {testParams.score}</li>
          <li><strong>Time:</strong> {testParams.time}</li>
          <li><strong>Game Type:</strong> {testParams.gameType}</li>
          <li><strong>Profile Image:</strong> Placeholder</li>
        </ul>
        
        <h4>Image URL:</h4>
        <code style={{ 
          background: '#f0f0f0', 
          padding: '8px', 
          borderRadius: '4px',
          fontSize: '12px',
          wordBreak: 'break-all'
        }}>
          {imageUrl}
        </code>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h4>🔧 How to test with different values:</h4>
        <p>Change the URL parameters in your browser:</p>
        <ul style={{ fontSize: '14px' }}>
          <li><code>score=</code> - Change the score value</li>
          <li><code>time=</code> - Change the time (format: MM:SS)</li>
          <li><code>userImg=</code> - Use a real profile image URL</li>
        </ul>
      </div>
    </div>
  );
} 