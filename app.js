// app.js
// [최종] Daum API가 반환하는 JSON을 처리하는 버전

document.addEventListener('DOMContentLoaded', () => {
    // ... (요소 가져오는 코드는 동일) ...
    const textInput = document.getElementById('textInput');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');
    const checkButton = document.getElementById('checkButton');
    const resultCard = document.getElementById('resultCard');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContent = document.getElementById('resultContent');

    // ... (resetButton, copyButton 클릭 이벤트 리스너는 동일) ...
    resetButton.addEventListener('click', () => { /* 이전 코드와 동일 */ });
    copyButton.addEventListener('click', () => { /* 이전 코드와 동일 */ });


    // 맞춤법 검사 버튼 기능 (수정됨)
    checkButton.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (text === '') {
            displayResult('no_input');
            return;
        }

        loadingIndicator.style.display = 'block';
        resultContent.style.display = 'none';
        checkButton.disabled = true;
        resetButton.disabled = true;
        copyButton.disabled = true;

        try {
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text }),
            });

            if (!response.ok) {
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
            loadingIndicator.style.display = 'none';
            checkButton.disabled = false;
            resetButton.disabled = false;
            copyButton.disabled = false;
        }
    });

    // --- 결과 표시 함수 (Daum API 호환) ---
    function displayResult(type, originalText = '', data = null) {
        resultContent.style.display = 'block';
        resultContent.innerHTML = ''; 

        let headerHtml = '';
        let bodyHtml = '';

        if (type === 'no_input') {
            // ... (생략 - 이전 코드와 동일)
        } else if (type === 'no_error') {
            // ... (생략 - 이전 코드와 동일)
        } else if (type === 'error_found' && data) {
            headerHtml = `
                <div class="result-header error-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> 오류가 발견되었습니다!</h3>
                </div>`;
            
            // 원본 텍스트를 기반으로 오류 하이라이트 적용
            let correctedHtml = originalText;

            // Daum API가 반환한 배열을 기반으로 텍스트 교체 (뒤에서부터)
            data.slice().reverse().forEach(error => {
                // Daum API 데이터 구조:
                const originalWord = error.org_str;       // 틀린 단어
                const suggestions = error.cand_word.split('|'); // 대치어 목록
                const start = error.start;                  // 시작 위치
                const end = error.end;                      // 끝 위치
                
                const suggestionTooltip = `${originalWord} → ${suggestions.join(' 또는 ')}`;
                const errorSpan = `<span class="error-text" data-suggestion="${suggestionTooltip}">${originalWord}</span>`;

                // 위치 기반으로 정확하게 교체
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
             // ... (생략 - 이전 코드와 동일)
        }
        
        // (생략된 부분은 이전 코드에서 복사해서 사용하세요)
        resultContent.innerHTML = headerHtml + bodyHtml;
    }

    // (생략된 버튼 리스너 등은 이전 코드와 동일하게 복사)
    resetButton.addEventListener('click', () => {
        textInput.value = '';
        resultContent.innerHTML = '';
        resultContent.style.display = 'none';
        resultCard.style.minHeight = '150px';
    });
    copyButton.addEventListener('click', () => {
        textInput.select();
        document.execCommand('copy');
        alert('텍스트가 클립보드에 복사되었습니다!');
    });
});
