// app.js
// [최종] '바른 API'의 JSON 응답을 UI(하이라이트)로 변환하는 버전

document.addEventListener('DOMContentLoaded', () => {
    // 1. HTML 요소들 가져오기 (이전과 동일)
    const textInput = document.getElementById('textInput');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');
    const checkButton = document.getElementById('checkButton');
    const resultCard = document.getElementById('resultCard');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContent = document.getElementById('resultContent');

    // 2. 초기화 버튼 (이전과 동일)
    resetButton.addEventListener('click', () => {
        textInput.value = '';
        resultContent.innerHTML = '';
        resultContent.style.display = 'none';
        resultCard.style.minHeight = '150px';
    });

    // 3. 복사 버튼 (이전과 동일)
    copyButton.addEventListener('click', () => {
        textInput.select();
        document.execCommand('copy');
        alert('텍스트가 클립보드에 복사되었습니다!');
    });


    // 4. 맞춤법 검사 버튼 (이전과 동일)
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
                const errorData = await response.json();
                console.error('Server function error:', errorData);
                throw new Error(`서버 함수 호출 실패: ${response.statusText}`);
            }
            
            // '바른 API'가 반환한 JSON 객체
            const bareunData = await response.json(); 
            
            // 5. JSON 데이터로 UI 생성
            // revisedBlocks (오류 목록)이 있는지 확인
            if (bareunData.revisedBlocks && bareunData.revisedBlocks.length > 0) {
                displayResult('error_found', bareunData);
            } else {
                displayResult('no_error'); // 오류 목록이 비어있으면 오류 없음
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

// app.js

// ... (다른 코드는 모두 동일) ...

    // 6. 결과 표시 함수 (*** 최종 수정 ***)
    function displayResult(type, data = null) {
        resultContent.style.display = 'block';
        resultContent.innerHTML = ''; 

        let headerHtml = '';
        let bodyHtml = '';

        if (type === 'no_input') {
             headerHtml = `<div class="result-header error-header"><h3><i class="fas fa-exclamation-triangle"></i> 입력이 필요합니다</h3></div>`;
            bodyHtml = `<div class="result-body error-body"><p>검사할 텍스트를 입력해주세요.</p></div>`;

        } else if (type === 'no_error') {
            headerHtml = `<div class="result-header success-header"><h3><i class="fas fa-check-circle"></i> 완벽합니다!</h3></div>`;
            bodyHtml = `<div class="result-body success-body"><i class="fas fa-check-circle success-icon"></i><p>맞춤법 오류가 없습니다</p></div>`;

        } else if (type === 'error_found' && data) {
            headerHtml = `<div class="result-header error-header"><h3><i class="fas fa-exclamation-triangle"></i> 오류가 발견되었습니다!</h3></div>`;
            
            let correctedHtml = data.origin;
            
            data.revisedBlocks.slice().reverse().forEach(block => {
                const originalWord = block.origin.content;
                const start = block.origin.beginOffset;
                const end = start + block.origin.length;
                
                const suggestion = block.revisions[0].revised;
                const helpId = block.revisions[0].helpId;
                const helpComment = data.helps[helpId]?.comment || "수정 제안";
                
                // 툴팁 텍스트에 \n (줄바꿈)이 포함되어 있습니다.
                const suggestionTooltip = `${originalWord} → ${suggestion}\n(${helpComment})`;
                
                const errorSpan = `<span class="error-text" data-suggestion="${suggestionTooltip}">${originalWord}</span>`;

                correctedHtml = 
                    correctedHtml.substring(0, start) + 
                    errorSpan + 
                    correctedHtml.substring(end);
            });
            
            // --- 여기가 수정되었습니다! (헷갈리는 span 제거) ---
            bodyHtml = `
                <div class="result-body error-body">
                    <p>아래 텍스트에서 <strong>하이라이트</strong>된 부분을 확인하세요. (마우스를 올리면 수정 제안이 보입니다)</p>
                    <div class="corrected-text-output">${correctedHtml.replace(/\n/g, '<br>')}</div>
                </div>`;
            // ----------------------------------------------------

        } else if (type === 'api_error') {
             headerHtml = `<div class="result-header error-header"><h3><i class="fas fa-times-circle"></i> 오류 발생</h3></div>`;
            bodyHtml = `<div class="result-body error-body"><p>맞춤법 검사 중 문제가 발생했습니다. (API 키 또는 서버 상태 확인)</p></div>`;
        }
        
        resultContent.innerHTML = headerHtml + bodyHtml;
    }
    
// ... (나머지 코드는 모두 동일) ...
});
