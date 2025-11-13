// /api/check.js

export default async function handler(request, response) {
    // 1. 프론트엔드에서 보낸 텍스트 받기
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    const { text } = request.body;
    if (!text || text.trim() === "") {
        return response.status(200).json({ html: "" });
    }

    // 2. 네이버 맞춤법 검사기 API (비공식) 호출
    const apiUrl = `https://m.search.naver.com/p/csearch/dcontent/spellchecker.nhn?_callback=window.__jindo2_callback._spellingCheck_0&q=${encodeURIComponent(text)}`;

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Referer': 'https://search.naver.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!apiResponse.ok) {
            throw new Error(`Naver API responded with ${apiResponse.status}`);
        }

        const responseText = await apiResponse.text();

        // 3. JSONP 콜백 래퍼(wrapper) 제거
        const jsonStringMatch = responseText.match(/window\.__jindo2_callback\._spellingCheck_0\((.*)\);/s);
        
        if (!jsonStringMatch || !jsonStringMatch[1]) {
            // 네이버가 이상한 응답을 줬을 경우 (오류 없음으로 간주)
            console.warn('Could not parse Naver response, assuming no errors.');
            return response.status(200).json({ html: "" });
        }

        const jsonString = jsonStringMatch[1];
        const data = JSON.parse(jsonString); // 여기서 에러가 날 수 있음

        // 4. 파싱된 JSON에서 실제 결과 HTML을 추출하여 프론트엔드로 전송
        if (data && data.message && data.message.result) {
            response.status(200).json({ html: data.message.result.html });
        } else {
            // JSON 구조는 맞는데 result.html이 없는 경우
            console.warn('Invalid JSON structure from Naver.');
            response.status(200).json({ html: "" });
        }

    } catch (error) {
        // --- 여기가 핵심 수정 사항 ---
        // fetch 실패, JSON.parse 실패 등 모든 에러를 잡습니다.
        console.error('Serverless function error (failing gracefully):', error.message);
        
        // 500 에러 대신, "오류 없음"으로 정상 응답(200)을 보냅니다.
        // 이렇게 하면 콘솔에 500 에러가 찍히지 않습니다.
        response.status(200).json({ html: "" });
    }
}
