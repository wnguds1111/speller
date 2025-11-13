document.addEventListener('DOMContentLoaded', () => {
    // ... (textInput, resetButton, copyButton 등 요소 가져오는 코드는 동일) ...
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
            // 1. Vercel에 만든 우리 API(/api/check)를 호출
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text }),
            });

            if (!response.ok) {
                // 504 에러 등이 발생하면 여기서 잡힙니다.
                throw new Error(`서버 함수 호출 실패: ${response.statusText}`);
            }
            
            // 2. 백엔드가 보낸 { html: "..." } 객체를 받음
            const resultData = await response.json(); 
            const correctedHtml = resultData.html;

            // 3. 네이버가 반환한 HTML에 오류 하이라이트 태그가 있는지 확인
            // 네이버는 오류를 <span class='gL'>, <span class='gR'> 등으로 표시합니다.
            if (correctedHtml.includes("class='gL'") || correctedHtml.includes("class='gR'") || correctedHtml.includes("class='gB'")) {
                displayResult('error_found', correctedHtml);
            } else {
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
    function displayResult(type, data = null) {
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
            // *** 여기가 핵심 ***
            // 이제 data는 JSON 배열이 아니라, 네이버가 생성한 HTML 문자열입니다.
            headerHtml = `
                <div class="result-header error-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> 오류가 발견되었습니다!</h3>
                </div>`;
            
            bodyHtml = `
                <div class="result-body error-body">
                    <p>수정된 텍스트는 다음과 같습니다. (오류는 색상으로 표시됨)</p>
                    <div class="corrected-text-output">
                        ${data.replace(/\n/g, '<br>')}
                    </div>
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
