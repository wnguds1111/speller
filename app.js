document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');
    const checkButton = document.getElementById('checkButton');
    const resultCard = document.getElementById('resultCard');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContent = document.getElementById('resultContent');

    // 초기화 버튼 기능
    resetButton.addEventListener('click', () => {
        textInput.value = '';
        resultContent.innerHTML = '';
        resultContent.style.display = 'none';
        // resultCard의 높이를 재설정 (결과가 없을 때 원래 크기로)
        resultCard.style.minHeight = '150px'; 
    });

    // 복사 버튼 기능
    copyButton.addEventListener('click', () => {
        textInput.select(); // 텍스트 영역 선택
        document.execCommand('copy'); // 복사 명령 실행
        alert('텍스트가 클립보드에 복사되었습니다!');
    });

    // 맞춤법 검사 버튼 기능
    checkButton.addEventListener('click', async () => {
        const text = textInput.value.trim();

        if (text === '') {
            displayResult('no_input');
            return;
        }

        // 로딩 인디케이터 표시
        loadingIndicator.style.display = 'block';
        resultContent.style.display = 'none';
        checkButton.disabled = true;
        resetButton.disabled = true;
        copyButton.disabled = true;

        try {
            // 네이버 맞춤법 검사기 프록시 호출
            const correctedData = await checkSpellingWithNaver(text);
            
            if (correctedData && correctedData.length > 0) {
                // 오류가 발견된 경우
                displayResult('error_found', correctedData);
            } else {
                // 오류가 없는 경우
                displayResult('no_error');
            }

        } catch (error) {
            console.error('맞춤법 검사 중 오류 발생:', error);
            displayResult('api_error');
        } finally {
            loadingIndicator.style.display = 'none';
            checkButton.disabled = false;
            resetButton.disabled = false;
            copyButton.disabled = false;
        }
    });


    // --- 결과 표시 함수 ---
    function displayResult(type, data = null) {
        resultContent.style.display = 'block';
        resultContent.innerHTML = ''; // 기존 내용 지우기

        let headerHtml = '';
        let bodyHtml = '';

        if (type === 'no_input') {
            headerHtml = `
                <div class="result-header error-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> 입력이 필요합니다</h3>
                </div>`;
            bodyHtml = `
                <div class="result-body error-body">
                    <p>검사할 텍스트를 입력해주세요.</p>
                </div>`;
        } else if (type === 'no_error') {
            headerHtml = `
                <div class="result-header success-header">
                    <h3><i class="fas fa-check-circle"></i> 완벽합니다!</h3>
                </div>`;
            bodyHtml = `
                <div class="result-body success-body">
                    <i class="fas fa-check-circle success-icon"></i>
                    <p>맞춤법 오류가 없습니다</p>
                </div>`;
        } else if (type === 'error_found' && data) {
            headerHtml = `
                <div class="result-header error-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> 오류가 발견되었습니다!</h3>
                </div>`;
            
            let correctedTextOutput = '';
            data.forEach(item => {
                // 네이버 API 파싱 결과에 따라 적절히 처리 (예: 원본 텍스트에 하이라이트)
                // 현재는 단어 단위로 하이라이트한다고 가정
                if (item.correct !== item.original) { // 원본과 수정본이 다르면 오류로 간주
                    correctedTextOutput += `<span class="error-text" data-suggestion="${item.original} → ${item.correct}">${item.original}</span> `;
                } else {
                    correctedTextOutput += `${item.original} `;
                }
            });

            bodyHtml = `
                <div class="result-body error-body">
                    <p>다음과 같은 오류가 발견되었습니다:</p>
                    <div class="corrected-text-output">${correctedTextOutput}</div>
                </div>`;

        } else if (type === 'api_error') {
             headerHtml = `
                <div class="result-header error-header">
                    <h3><i class="fas fa-times-circle"></i> 오류 발생</h3>
                </div>`;
            bodyHtml = `
                <div class="result-body error-body">
                    <p>맞춤법 검사 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
                    <p><i>(참고: 네이버 검사기는 비공식 연동이므로 작동이 불안정할 수 있습니다.)</i></p>
                </div>`;
        }

        resultContent.innerHTML = headerHtml + bodyHtml;
    }


    // --- 네이버 맞춤법 검사기 비공식 연동 함수 ---
    async function checkSpellingWithNaver(text) {
        // CORS 문제 해결을 위해 프록시 서버를 경유해야 합니다.
        // 이 예시에서는 임시로 'https://cors-anywhere.herokuapp.com/'를 사용하지만, 
        // 실제 서비스에서는 직접 만든 서버리스 함수(AWS Lambda 등)나 Node.js 서버를 사용하는 것이 안전합니다.
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; 
        const naverSpellCheckUrl = 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=1&ie=utf8&query=';
        
        // 텍스트를 URL 인코딩하여 네이버 쿼리 생성
        const encodedText = encodeURIComponent(text);
        const fullUrl = `${proxyUrl}${naverSpellCheckUrl}${encodedText}+맞춤법`;

        try {
            const response = await fetch(fullUrl);
            const htmlText = await response.text();

            // HTML 파싱하여 결과 추출 (매우 취약한 부분)
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            const resultContainer = doc.querySelector('.spelling_chk_area._result_box');
            
            // 결과 컨테이너가 없으면 오류 없음으로 간주하거나 오류 처리
            if (!resultContainer) {
                return []; // 오류 없음
            }

            const errorItems = resultContainer.querySelectorAll('.option'); // 오류 항목들
            const corrections = [];

            errorItems.forEach(item => {
                const originalText = item.querySelector('.text_highlight').textContent.trim();
                const correctedText = item.querySelector('.word_fix').textContent.trim();
                const description = item.querySelector('.explain').textContent.trim();
                
                // 단어만 추출하기 위해 불필요한 부분 제거
                const cleanOriginal = originalText.replace(/「|」/g, '').trim();
                const cleanCorrected = correctedText.replace(/「|」/g, '').trim();

                corrections.push({
                    original: cleanOriginal,
                    correct: cleanCorrected,
                    description: description
                });
            });
            
            console.log("네이버 파싱 결과:", corrections);
            return corrections;

        } catch (error) {
            console.error('네이버 맞춤법 검사기 파싱 오류:', error);
            throw new Error('네이버 맞춤법 검사기 연결에 실패했습니다.');
        }
    }
});
