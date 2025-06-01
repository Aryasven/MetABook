// PWAInstallPrompt.jsx
import { useState, useEffect } from 'react';
import { DesktopTower, DeviceMobile, Download } from 'phosphor-react';

export function PWAInstallPrompt({ compact = false }) {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setPlatform('ios');
    } else {
      setPlatform('desktop');
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPromptEvent) {
      // Show the install prompt
      installPromptEvent.prompt();
      
      // Wait for the user to respond to the prompt
      installPromptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        // Clear the saved prompt since it can't be used again
        setInstallPromptEvent(null);
      });
    } else {
      // If no install prompt event is available, show manual instructions
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow transition-all text-sm"
        >
          <Download size={16} weight="bold" />
          <span>Install App</span>
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2">Complete App Coming Soon!</h3>
              <p className="text-gray-300 text-sm mb-4">Meanwhile, use it like an app by adding it to your home screen:</p>
              
              {platform === 'ios' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600/30 p-2 rounded-full">
                      <DeviceMobile size={24} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-200">To install on iOS:</p>
                      <ol className="list-decimal pl-5 text-gray-300 space-y-1 mt-2">
                        <li>Tap the Share button in Safari</li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" in the top right corner</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {platform === 'android' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600/30 p-2 rounded-full">
                      <DeviceMobile size={24} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-200">To install on Android:</p>
                      <ol className="list-decimal pl-5 text-gray-300 space-y-1 mt-2">
                        <li>Tap the menu icon (3 dots) in Chrome</li>
                        <li>Tap "Add to Home screen"</li>
                        <li>Tap "Add" to confirm</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {platform === 'desktop' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600/30 p-2 rounded-full">
                      <DesktopTower size={24} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-200">To install on desktop:</p>
                      <ol className="list-decimal pl-5 text-gray-300 space-y-1 mt-2">
                        <li>Look for the install icon in your browser's address bar</li>
                        <li>Click on it and follow the prompts</li>
                        <li>Or use the browser menu and select "Install MetABook"</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={closeModal}
                className="mt-6 w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow transition-all"
      >
        <DesktopTower size={20} weight="duotone" />
        <span>Install MetABook App</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2">Complete App Coming Soon!</h3>
            <p className="text-gray-300 text-sm mb-4">Meanwhile, use it like an app by adding it to your home screen:</p>
            
            {platform === 'ios' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600/30 p-2 rounded-full">
                    <DeviceMobile size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-200">To install on iOS:</p>
                    <ol className="list-decimal pl-5 text-gray-300 space-y-1 mt-2">
                      <li>Tap the Share button in Safari</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Tap "Add" in the top right corner</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {platform === 'android' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600/30 p-2 rounded-full">
                    <DeviceMobile size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-200">To install on Android:</p>
                    <ol className="list-decimal pl-5 text-gray-300 space-y-1 mt-2">
                      <li>Tap the menu icon (3 dots) in Chrome</li>
                      <li>Tap "Add to Home screen"</li>
                      <li>Tap "Add" to confirm</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {platform === 'desktop' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600/30 p-2 rounded-full">
                    <DesktopTower size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-200">To install on desktop:</p>
                    <ol className="list-decimal pl-5 text-gray-300 space-y-1 mt-2">
                      <li>Look for the install icon in your browser's address bar</li>
                      <li>Click on it and follow the prompts</li>
                      <li>Or use the browser menu and select "Install MetABook"</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={closeModal}
              className="mt-6 w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}