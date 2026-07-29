const inputText = document.getElementById('inputText');

function countCharacters() {
    const text = inputText.value;
    const characters = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const lines = text === '' ? 0 : text.split('\n').length;

    document.getElementById('charCount').textContent = characters;
    document.getElementById('wordCount').textContent = words;
    document.getElementById('lineCount').textContent = lines;
}

inputText.addEventListener('input', countCharacters);
countCharacters();
