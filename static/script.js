const extractBtn = document.getElementById('extractBtn');
const videoUrlInput = document.getElementById('videoUrl');
const loading = document.getElementById('loading');
const loadingMsg = document.getElementById('loadingMsg');
const result = document.getElementById('result');
const error = document.getElementById('error');
const errorMsg = document.getElementById('errorMsg');

const videoTitle = document.getElementById('videoTitle');
const resSelect = document.getElementById('resSelect');
const thumbnail = document.getElementById('thumbnail');
const downloadBtn = document.getElementById('downloadBtn');

let extractedData = null;

extractBtn.addEventListener('click', async () => {
    const url = videoUrlInput.value.trim();
    if (!url) return;

    // Reset UI
    result.classList.add('hidden');
    error.classList.add('hidden');
    loading.classList.remove('hidden');
    loadingMsg.textContent = 'Analyzing video...';
    extractBtn.disabled = true;

    try {
        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to extract video');
        }

        extractedData = data;

        // Populate Resolution Dropdown
        resSelect.innerHTML = '';
        data.resolutions.forEach((res, index) => {
            const option = document.createElement('option');
            option.value = index; // Store array index
            option.textContent = `${res.resolution} (${res.ext})${res.needs_merge ? ' - Requires Merging' : ' - Direct Download'}`;
            resSelect.appendChild(option);
        });

        // Update UI
        videoTitle.textContent = data.title;
        thumbnail.src = data.thumbnail;

        // Initial button text based on first option
        const initialRes = data.resolutions[0];
        downloadBtn.textContent = `Download ${initialRes.resolution}`;

        loading.classList.add('hidden');
        result.classList.remove('hidden');
    } catch (err) {
        loading.classList.add('hidden');
        error.classList.remove('hidden');
        errorMsg.textContent = err.message;
    } finally {
        extractBtn.disabled = false;
    }
});

resSelect.addEventListener('change', () => {
    const selectedIdx = resSelect.value;
    const selectedRes = extractedData.resolutions[selectedIdx];
    downloadBtn.textContent = `Download ${selectedRes.resolution}`;
});

downloadBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!extractedData) return;

    const selectedIdx = resSelect.value;
    const selectedRes = extractedData.resolutions[selectedIdx];

    if (!selectedRes.needs_merge && selectedRes.url) {
        // Direct link download – open in new tab
        window.open(selectedRes.url, '_blank');
        return;
    }

    // Needs server-side merge: call /api/download via POST
    loading.classList.remove('hidden');
    loadingMsg.textContent = `Downloading & merging ${selectedRes.resolution}... This may take a minute.`;
    result.classList.add('hidden');
    downloadBtn.disabled = true;

    try {
        const response = await fetch(`/api/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: extractedData.url,
                height: selectedRes.height
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Download failed');
        }

        // Trigger browser file download
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `${extractedData.title || 'video'}_${selectedRes.resolution}.mp4`;
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

    } catch (err) {
        error.classList.remove('hidden');
        errorMsg.textContent = err.message;
    } finally {
        loading.classList.add('hidden');
        result.classList.remove('hidden');
        downloadBtn.disabled = false;
    }
});
