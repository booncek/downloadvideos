document.addEventListener('DOMContentLoaded', () => {
    const downloadForm = document.getElementById('downloadForm');
    const extractBtn = document.getElementById('extractBtn');
    const videoUrlInput = document.getElementById('videoUrl');
    
    // States
    const loading = document.getElementById('loading');
    const loadingMsg = document.getElementById('loadingMsg');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const errorMsg = document.getElementById('errorMsg');
    
    // Result elements
    const videoTitle = document.getElementById('videoTitle');
    const resSelect = document.getElementById('resSelect');
    const thumbnail = document.getElementById('thumbnail');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadBtnText = document.getElementById('downloadBtnText');
    
    let extractedData = null;

    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = videoUrlInput.value.trim();
        if (!url) return;

        // Reset UI
        result.classList.add('hidden');
        error.classList.add('hidden');
        loading.classList.remove('hidden');
        loadingMsg.textContent = 'Analyzing your video...';
        extractBtn.disabled = true;

        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to extract video details.');
            }

            extractedData = data;

            // Populate Resolution Dropdown
            resSelect.innerHTML = '';
            data.resolutions.forEach((res, index) => {
                const option = document.createElement('option');
                option.value = index; 
                option.textContent = `${res.resolution} (${res.ext})${res.needs_merge ? ' - Standard Speed' : ' - Fast'}`;
                if (index === 0) option.selected = true;
                resSelect.appendChild(option);
            });

            // Update UI
            videoTitle.textContent = data.title;
            // Set thumbnail or fallback if none
            thumbnail.src = data.thumbnail || 'https://via.placeholder.com/600x400?text=No+Thumbnail';

            if (data.resolutions.length > 0) {
                const initialRes = data.resolutions[0];
                downloadBtnText.textContent = `Download ${initialRes.resolution}`;
            }

            loading.classList.add('hidden');
            result.classList.remove('hidden');
            
            // Scroll to result slightly delayed for animation
            setTimeout(() => {
                result.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);

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
        if (extractedData && extractedData.resolutions[selectedIdx]) {
            const selectedRes = extractedData.resolutions[selectedIdx];
            downloadBtnText.textContent = `Download ${selectedRes.resolution}`;
        }
    });

    downloadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!extractedData) return;

        const selectedIdx = resSelect.value;
        if (!selectedIdx && selectedIdx !== "0") return;
        
        const selectedRes = extractedData.resolutions[selectedIdx];

        if (!selectedRes.needs_merge && selectedRes.url) {
            window.open(selectedRes.url, '_blank');
            return;
        }

        // Server-side merge needed
        loading.classList.remove('hidden');
        loadingMsg.textContent = `Processing ${selectedRes.resolution}... This might take a minute.`;
        result.classList.add('hidden');
        error.classList.add('hidden');
        downloadBtn.classList.add('disabled');

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: extractedData.url,
                    height: selectedRes.height
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Download failed during processing.');
            }

            // Trigger browser download
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safeTitle = (extractedData.title || 'video').replace(/[^a-zA-Z0-9\s-_\.\!\~]/g, "").trim();
            const filename = `${safeTitle}_${selectedRes.resolution}.mp4`;
            
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
            downloadBtn.classList.remove('disabled');
        }
    });
});
