function generateQRCode() {
    const inputText = document.getElementById('inputText').value;
    const errorMessage = document.getElementById('errorMessage');
    const resultPanel = document.getElementById('resultPanel');
    const qrContainer = document.getElementById('qrcode');

    hideError(errorMessage);

    if (inputText.trim() === '') {
        resultPanel.hidden = true;
        showError(errorMessage, 'Please enter text or a URL before generating.');
        return;
    }

    qrContainer.innerHTML = '';
    resultPanel.hidden = false;

    new QRCode(qrContainer, {
        text: inputText,
        width: 200,
        height: 200,
        colorDark: '#111827',
        colorLight: '#FFFFFF',
    });
}

document.getElementById('generateBtn').addEventListener('click', generateQRCode);
document.getElementById('inputText').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') generateQRCode();
});
