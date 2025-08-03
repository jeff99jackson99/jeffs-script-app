let synth = window.speechSynthesis;

async function loadScriptMap() {
  const local = localStorage.getItem('customScript');
  if (local) return JSON.parse(local);
  const res = await fetch('script.json');
  return res.json();
}

function getBestMatch(text, scriptMap) {
  text = text.toLowerCase();
  for (const key in scriptMap) {
    if (text.includes(key.toLowerCase())) {
      return scriptMap[key];
    }
  }
  return null;
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  synth.speak(utter);
}

async function startListening() {
  const scriptMap = await loadScriptMap();
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('transcript').innerText = "🗣 " + transcript;

    const match = getBestMatch(transcript, scriptMap);
    if (match) {
      document.getElementById('response').innerText = "💬 " + match;
      speak(match);
    } else {
      document.getElementById('response').innerText = "❌ No match found.";
    }
  };

  recognition.onerror = (e) => {
    document.getElementById('response').innerText = "Error: " + e.error;
  };

  recognition.start();
}

async function loadScriptEditor() {
  const map = await loadScriptMap();
  document.getElementById('scriptArea').value = JSON.stringify(map, null, 2);
}
function saveScript() {
  try {
    const content = document.getElementById('scriptArea').value;
    const parsed = JSON.parse(content);
    localStorage.setItem('customScript', JSON.stringify(parsed));
    document.getElementById('saveStatus').innerText = "✅ Script saved!";
  } catch (e) {
    document.getElementById('saveStatus').innerText = "❌ Invalid JSON!";
  }
}

function extractPDF() {
  const input = document.getElementById('pdfUpload');
  if (!input.files[0]) {
    document.getElementById('pdfStatus').innerText = "❌ No file selected.";
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedarray).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + "\n";
    }
    document.getElementById('scriptArea').value = JSON.stringify({ "extracted": fullText.slice(0, 500) + "..." }, null, 2);
    document.getElementById('pdfStatus').innerText = "✅ PDF text extracted. You can now format and save it.";
  };
  reader.readAsArrayBuffer(input.files[0]);
}

loadScriptEditor();