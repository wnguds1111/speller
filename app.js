// app.js
// [최종] Daum API가 반환하는 JSON을 처리하는 버전
// 이 파일에는 'export'가 없습니다.

document.addEventListener('DOMContentLoaded', () => {
    // 1. HTML 요소들 가져오기
    const textInput = document.getElementById('textInput');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');
    const checkButton = document.getElementById('checkButton');
    const resultCard = document.getElementById('resultCard');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContent = document.getElementById('resultContent');

    // 2. 초기화 버튼
    resetButton.addEventListener('click', () => {
        textInput.value = '';
        resultContent.innerHTML = '';
        resultContent.style.display = 'none';
        resultCard.style.minHeight = '150px';
    });

    // 3. 복사 버튼
    copyButton.addEventListener('click', () => {
        textInput.select();
        document.execCommand('copy');
        alert('텍스트가 클립보드에 복사되었습니다!');
    });


    // 4. 맞춤법 검사 버튼
    checkButton.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (text === '') {
            displayResult('no_input');
            return;
        }

        // 로딩 시작
        loadingIndicator.style.display = 'block';
        resultContent.style.display = 'none';
        checkButton.disabled = true;
        resetButton.disabled = true;
        copyButton.disabled = true;

        try {
            // Vercel 서버(/api/check)에 검사 요청
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text }),
            });

            if (!response.ok) {
                // 500, 504, 404 등 서버 에러
                throw new Error(`서버 함수 호출 실패: ${response.statusText}`);
            }
            
            // Daum API가 반환한 JSON 배열 (예: [ { ... }, { ... } ])
            const spellCheckData = await response.json(); 
            
            if (spellCheckData && spellCheckData.length > 0) {
                // 오류가 1개 이상 발견됨
                displayResult('error_found', text, spellCheckData);
            } else {
                // 빈 배열 []이 오면 오류 없음
                displayResult('no_error');
            }

        } catch (error) {
            console.error('맞춤법 검사 중 오류 발생:', error);
            displayResult('api_error');
        } finally {
            // 로딩 끝
            loadingIndicator.style.display = 'none';
            checkButton.disabled = false;
            resetButton.disabled = false;
            copyButton.disabled = false;
        }
    });

    // 5. 결과 표시 함수
    function displayResult(type, originalText = '', data = null) {
        resultContent.style.display = 'block';
        resultContent.innerHTML = ''; 

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
            
            let correctedHtml = originalText;
            
            data.slice().reverse().forEach(error => {
                const originalWord = error.org_str;
                const suggestions = error.cand_word.split('|');
                const start = error.start;
                const end = error.end;
                
                const suggestionTooltip = `${originalWord} → ${suggestions.join(' 또는 ')}`;
                const errorSpan = `<span class="error-text" data-suggestion="${suggestionTooltip}">${originalWord}</span>`;

                correctedHtml = 
                    correctedHtml.substring(0, start) + 
                    errorSpan + 
                    correctedHtml.substring(end);
            });
            
            bodyHtml = `
                <div class="result-body error-body">
                    <p>아래 텍스트에서 <span class="error-text" data-suggestion="오류가 있는 단어 위에 마우스를 올려보세요">하이라이트</span>된 부분을 확인하세요.</p>
                    <div class="corrected-text-output">${correctedHtml.replace(/\n/g, '<br>')}</div>
                </div>`;

        } else if (type === 'api_error') {
             headerHtml = `
                <div class="result-header error-header">
                    <h3><i class="fas fa-times-circle"></i> 오류 발생</h3>
                </div>`;
            bodyHtml = `
                <div class="result-body error-body">
                    <p>맞춤법 검사 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
                </div>`;
        }
        
        resultContent.innerHTML = headerHtml + bodyHtml;
    }
});
