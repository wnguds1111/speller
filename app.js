// app.js
// [최종] 클릭-투-픽스(Click-to-fix) 및 하단 제안 리스트 기능 추가

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
            
            const bareunData = await response.json(); 
            
            if (bareunData.revisedBlocks && bareunData.revisedBlocks.length > 0) {
                displayResult('error_found', bareunData);
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

    // 5. 결과 표시 함수 (*** 최종 수정 ***)
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
            
            let correctedHtml = ""; // 하이라이트된 HTML이 담길 변수
            let suggestionListHtml = '<ul class="suggestion-list">'; // 하단 제안 목록 HTML
            let lastIndex = 0; // 원본 텍스트 인덱스 추적
            
            // API가 준 오류 목록(revisedBlocks)을 순서대로 순회
            data.revisedBlocks.forEach((block) => {
                const start = block.origin.beginOffset;
                const end = start + block.origin.length;
                const originalWord = block.origin.content;
                const suggestion = block.revisions[0].revised;
                const helpComment = data.helps[block.revisions[0].helpId]?.comment || "수정 제안";

                // 1. 하이라이트 HTML 생성
                // (오류 시작점 전까지의) 정상 텍스트 추가
                correctedHtml += data.origin.substring(lastIndex, start);
                // 오류 텍스트를 클릭 가능한 <span>으로 감싸기
                correctedHtml += `<span class="error-text clickable" data-revised="${suggestion}">${originalWord}</span>`;
                lastIndex = end; // 인덱스 업데이트

                // 2. 하단 제안 목록 HTML 생성
                suggestionListHtml += `
                    <li>
                        <div class="suggestion-text">
                            <strong>${originalWord}</strong> → <strong class="suggestion-word">${suggestion}</strong>
                            <p class="suggestion-help">${helpComment.split('\n')[0]}</p>
                        </div>
                    </li>`;
            });

            // 3. 남은 텍스트 마저 붙이기
            correctedHtml += data.origin.substring(lastIndex);
            suggestionListHtml += '</ul>';
            
            bodyHtml = `
                <div class="result-body error-body">
                    <p>아래 텍스트에서 <strong>하이라이트</strong>된 부분을 클릭하면 수정됩니다.</p>
                    <div class="corrected-text-output">${correctedHtml.replace(/\n/g, '<br>')}</div>
                    ${suggestionListHtml}
                </div>`;

        } else if (type === 'api_error') {
             headerHtml = `<div class="result-header error-header"><h3><i class="fas fa-times-circle"></i> 오류 발생</h3></div>`;
            bodyHtml = `<div class="result-body error-body"><p>맞춤법 검사 중 문제가 발생했습니다. (API 키 또는 서버 상태 확인)</p></div>`;
        }
        
        resultContent.innerHTML = headerHtml + bodyHtml;
    }

    // --- 6. [새로 추가] 클릭-투-픽스 이벤트 리스너 ---
    // resultContent 영역 안에서 클릭 이벤트가 발생하면 감지 (이벤트 위임)
    resultContent.addEventListener('click', function(event) {
        
        // 클릭된 요소가 'clickable' 클래스를 가지고 있는지 확인
        const target = event.target;
        if (target.classList.contains('clickable')) {
            
            // 1. 데이터 가져오기
            const revisedText = target.dataset.revised;
            
            // 2. 텍스트 교체
            target.textContent = revisedText;
            
            // 3. 스타일 변경 (클릭 불가능하게, 수정 완료 스타일로)
            target.classList.remove('error-text', 'clickable');
            target.classList.add('corrected-text');
        }
    });
});
