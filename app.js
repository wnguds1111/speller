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

    // 6. 결과 표시 함수 (*** 최종 버전 ***)
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
            // *** 여기가 핵심 ***
            // '바른 API'의 JSON으로 하이라이트 UI 생성
            headerHtml = `<div class="result-header error-header"><h3><i class="fas fa-exclamation-triangle"></i> 오류가 발견되었습니다!</h3></div>`;
            
            let correctedHtml = data.origin; // 원본 텍스트로 시작
            
            // 여러 오류가 있을 때 인덱스가 꼬이지 않도록, 배열을 뒤집어서(reverse) 뒤에서부터 수정
            data.revisedBlocks.slice().reverse().forEach(block => {
                const originalWord = block.origin.content;
                const start = block.origin.beginOffset;
                const end = start + block.origin.length;
                
                // 제안 단어 (첫 번째 제안 사용)
                const suggestion = block.revisions[0].revised;
                
                // 툴팁에 넣을 도움말 (helps 객체에서 찾기)
                const helpId = block.revisions[0].helpId;
                const helpComment = data.helps[helpId]?.comment || "수정 제안";
                
                // 툴팁 텍스트 생성 (줄바꿈 \n 추가)
                const suggestionTooltip = `${originalWord} → ${suggestion}\n(${helpComment})`;
                
                // CSS에서 만든 .error-text 클래스와 data-suggestion 속성 사용
                const errorSpan = `<span class="error-text" data-suggestion="${suggestionTooltip}">${originalWord}</span>`;

                // 원본 텍스트의 해당 부분을 <span>으로 교체
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
             headerHtml = `<div class="result-header error-header"><h3><i class="fas fa-times-circle"></i> 오류 발생</h3></div>`;
            bodyHtml = `<div class="result-body error-body"><p>맞춤법 검사 중 문제가 발생했습니다. (API 키 또는 서버 상태 확인)</p></div>`;
        }
        
        resultContent.innerHTML = headerHtml + bodyHtml;
    }
});
