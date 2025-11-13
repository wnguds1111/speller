// /api/check.js

export default async function handler(request, response) {
    // 1. 프론트엔드에서 보낸 텍스트 받기
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    const { text } = request.body;
    if (!text || text.trim() === "") {
        // 텍스트가 비어있으면 검사할 필요 없이 빈 HTML 반환
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
            // 네이버 서버 자체가 500, 404 등을 보낼 경우
            throw new Error(`Naver API responded with ${apiResponse.status}`);
        }

        const responseText = await apiResponse.text();

        // 3. JSONP 콜백 래퍼(wrapper) 제거 (더 안전하게)
        const jsonStringMatch = responseText.match(/window\.__jindo2_callback\._spellingCheck_0\((.*)\);/s);
        
        // *** 여기가 중요: 매칭 실패 시 크래시 대신 빈 HTML 반환 ***
        if (!jsonStringMatch || !jsonStringMatch[1]) {
            // "test" 같은 영어 단어는 네이버가 JSONP가 아닌 다른 HTML을 반환함
            // 이 경우, 오류가 없는 것으로 간주하고 빈 HTML(오류 없음)을 반환
            console.warn('Could not parse Naver response, assuming no errors.');
            return response.status(200).json({ html: "" }); // 크래시 대신 정상 응답
        }

        const jsonString = jsonStringMatch[1];
        const data = JSON.parse(jsonString);

        // 4. 파싱된 JSON에서 실제 결과 HTML을 추출하여 프론트엔드로 전송
        if (data && data.message && data.message.result) {
            response.status(200).json({ html: data.message.result.html });
        } else {
            // JSON 구조는 맞는데 result.html이 없는 경우
            console.warn('Invalid JSON structure from Naver.');
            response.status(200).json({ html: "" }); // 크래시 대신 정상 응답
        }

    } catch (error) {
        // fetch 실패, JSON.parse 실패 등 모든 에러를 잡습니다.
        console.error('Serverless function error:', error.message);
        // 여기서 500을 보내는 대신, 에러가 났다는 것을 프론트엔드에 알려줄 수도 있지만,
        // 일단은 500 에러를 보내서 프론트엔드가 'api_error' 케이스를 타도록 합니다.
        response.status(500).json({ error: error.message });
    }
}
