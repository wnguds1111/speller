document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');
    const checkButton = document.getElementById('checkButton');
    const resultCard = document.getElementById('resultCard');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContent = document.getElementById('resultContent');

    // ... (resetButton, copyButton 코드는 동일하게 둡니다) ...

    // 초기화 버튼 기능
    resetButton.addEventListener('click', () => {
        textInput.value = '';
        resultContent.innerHTML = '';
        resultContent.style.display = 'none';
        resultCard.style.minHeight = '150px';
    });

    // 복사 버튼 기능
    copyButton.addEventListener('click', () => {
        textInput.select();
        document.execCommand('copy');
        alert('텍스트가 클립보드에 복사되었습니다!');
    });

    // --- 맞춤법 검사 버튼 기능 (수정됨) ---
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
            // 1. Vercel에 만든 우리 API(/api/check)를 호출합니다.
            const response = await fetch('/api/check', { // <-- 여기가 중요!
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }),
            });

            if (!response.ok) {
                throw new Error(`서버 함수 호출 실패: ${response.statusText}`);
            }
            
            // 부산대 API가 "data = [...]" 부분을 파싱해서 JSON으로 만듦
            const spellCheckData = await response.json(); 
            
            if (spellCheckData && spellCheckData.length > 0) {
                // 2. 오류가 발견된 경우 (PNU API 포맷)
                displayResult('error_found', text, spellCheckData);
            } else {
                // 3. 오류가 없는 경우
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

    // --- 결과 표시 함수 (수정됨) ---
    function displayResult(type, originalText = '', data = null) {
        resultContent.style.display = 'block';
        resultContent.innerHTML = ''; 

        let headerHtml = '';
        let bodyHtml = '';

        if (type === 'no_input') {
            headerHtml = `... (이전과 동일) ...`; // (생략)
            bodyHtml = `... (이전과 동일) ...`; // (생략)
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
            
            // 원본 텍스트를 기반으로 오류 하이라이트 적용
            let correctedHtml = originalText;

            // 오류 데이터를 순회하며 원본 텍스트를 교체 (뒤에서부터)
            data.slice().reverse().forEach(error => {
                // PNU API 데이터 구조:
                // error.str (틀린 단어)
                // error.word (대치어, |로 구분됨)
                // error.start (시작 위치), error.end (끝 위치)
                
                const originalWord = error.str;
                const suggestions = error.word.split('|'); // 대치어 목록
                const bestSuggestion = suggestions[0]; // 첫 번째 제안
                
                const suggestionTooltip = `${originalWord} → ${suggestions.join(' 또는 ')}`;
                const errorSpan = `<span class="error-text" data-suggestion="${suggestionTooltip}">${originalWord}</span>`;

                // 위치 기반으로 정확하게 교체
                correctedHtml = 
                    correctedHtml.substring(0, error.start) + 
                    errorSpan + 
                    correctedHtml.substring(error.end);
            });
            
            bodyHtml = `
                <div class="result-body error-body">
                    <p>아래 텍스트에서 <span class="error-text" data-suggestion="오류가 있는 단어 위에 마우스를 올려보세요">하이라이트</span>된 부분을 확인하세요.</p>
                    <div class="corrected-text-output">${correctedHtml.replace(/\n/g, '<br>')}</div>
                </div>`;

        } else if (type === 'api_error') {
             headerHtml = `... (이전과 동일) ...`; // (생략)
            bodyHtml = `... (이전과 동일) ...`; // (생략)
        }
        
        // (생략된 부분은 이전 코드에서 복사해서 사용하세요)
        resultContent.innerHTML = headerHtml + bodyHtml;
    }
});
