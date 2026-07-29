const inputText = document.getElementById('inputText');
const resultPanel = document.getElementById('resultPanel');
const result = document.getElementById('result');
const errorMessage = document.getElementById('errorMessage');
const copyBtn = document.getElementById('copyBtn');

function calculateSHA1() {
    hideError(errorMessage);

    const text = inputText.value;
    if (text.trim() === '') {
        resultPanel.hidden = true;
        showError(errorMessage, 'Please enter text before calculating SHA-1.');
        return;
    }

    result.textContent = sha1(text);
    resultPanel.hidden = false;
}

document.getElementById('calculateBtn').addEventListener('click', calculateSHA1);
inputText.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'Enter') calculateSHA1();
});
copyBtn.addEventListener('click', () => copyText(result.textContent, copyBtn));
