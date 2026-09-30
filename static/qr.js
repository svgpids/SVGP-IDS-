async function generateQR() {
    const textInput = document.getElementById("qrText");
    const errorMsg = document.getElementById("errorMsg");
    const loader = document.getElementById("loader");
    const qrResult = document.getElementById("qrResult");
    const qrImage = document.getElementById("qrImage");
    const downloadBtn = document.getElementById("downloadBtn");

    const text = textInput.value.trim();

    // Reset UI state
    errorMsg.innerText = "";
    qrResult.classList.add("hide");

    if (!text) {
        errorMsg.innerText = "Dhayachesi edhaina text leda link type cheyandi!";
        return;
    }

    loader.classList.remove("hide");

    try {
        const response = await fetch("/generate_qr", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: text })
        });

        const data = await response.json();
        loader.classList.add("hide");

        if (response.ok && data.status === "success") {
            const dataUrl = `data:image/png;base64,${data.qr_image}`;
            qrImage.src = dataUrl;
            downloadBtn.href = dataUrl;
            qrResult.classList.remove("hide");
        } else {
            errorMsg.innerText = data.error || "QR Code generate cheyadam lo error vachindi.";
        }
    } catch (err) {
        loader.classList.add("hide");
        errorMsg.innerText = "Server tho connect avvaledhu. Malli try cheyandi.";
    }
}

// Enter key press chesinappudu automatic ga generate avvadaniki
document.getElementById("qrText").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        generateQR();
    }
});