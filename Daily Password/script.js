function calculateDailyPassword(year, month, day) {
    if (![year, month, day].every(Number.isInteger)) {
        throw new Error('Select a valid date.');
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
        throw new Error('Select a valid date.');
    }

    const lastTwoDigitsOfYear = year % 100;
    const calculatedValue = (lastTwoDigitsOfYear + 169) * (month * month) * (day + 8583);
    const integerValue = Math.trunc(calculatedValue);

    return String(integerValue).slice(-6);
}

function getDailyPassword(date = new Date()) {
    return calculateDailyPassword(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    );
}

function formatLocalDate(date) {
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        throw new Error('Select a valid date.');
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
    };
}

if (typeof document !== 'undefined') {
    const dateInput = document.getElementById('dateInput');
    const resultPanel = document.getElementById('resultPanel');
    const result = document.getElementById('result');
    const calculationDetails = document.getElementById('calculationDetails');
    const errorMessage = document.getElementById('errorMessage');
    const copyBtn = document.getElementById('copyBtn');

    function generatePassword() {
        hideError(errorMessage);

        try {
            const { year, month, day } = parseDateInput(dateInput.value);
            result.textContent = calculateDailyPassword(year, month, day);
            calculationDetails.textContent =
                `Using year ${year % 100}, month ${month}, and day ${day}.`;
            resultPanel.hidden = false;
        } catch (error) {
            resultPanel.hidden = true;
            showError(errorMessage, error.message);
        }
    }

    function useToday() {
        dateInput.value = formatLocalDate(new Date());
        generatePassword();
    }

    document.getElementById('generateBtn').addEventListener('click', generatePassword);
    document.getElementById('todayBtn').addEventListener('click', useToday);
    dateInput.addEventListener('change', generatePassword);
    copyBtn.addEventListener('click', () => copyText(result.textContent, copyBtn));

    useToday();
}

if (typeof module !== 'undefined') {
    module.exports = {
        calculateDailyPassword,
        getDailyPassword,
        formatLocalDate,
        parseDateInput,
    };
}
