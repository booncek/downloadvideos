document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        body.classList.add('dark-mode');
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        // Save preference
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Downloader Logic ---
    const downloadForm = document.getElementById('downloadForm');
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

    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const url = videoUrlInput.value.trim();
        if (!url) return;

        result.classList.add('hidden');
        error.classList.add('hidden');
        loading.classList.remove('hidden');
        loadingMsg.textContent = 'Parsing link...';
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
                option.textContent = `${res.resolution} - ${res.ext} ${res.needs_merge ? '(Processing Needed)' : ''}`;
                if (index === 0) option.selected = true;
                resSelect.appendChild(option);
            });

            videoTitle.textContent = data.title;
            thumbnail.src = data.thumbnail || 'https://via.placeholder.com/600x400?text=Request+Failed';

            loading.classList.add('hidden');
            result.classList.remove('hidden');

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
        loadingMsg.textContent = `Processing video at ${selectedRes.resolution}...`;
        result.classList.add('hidden');
        error.classList.add('hidden');
        downloadBtn.classList.add('disabled');
        downloadBtn.disabled = true;

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
                throw new Error(errData.detail || 'Server encountered an error processing the video.');
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
            downloadBtn.disabled = false;
        }
    });
});
