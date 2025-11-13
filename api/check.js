// /api/check.js

export default async function handler(request, response) {
    // 1. 프론트엔드에서 보낸 텍스트 받기
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    const { text } = request.body;
    if (!text) {
        return response.status(400).json({ error: 'No text provided' });
    }

    // 2. 네이버 맞춤법 검사기 API (비공식) 호출
    // 네이버 모바일 검색에서 사용하는 JSONP 엔드포인트입니다.
    const apiUrl = `https://m.search.naver.com/p/csearch/dcontent/spellchecker.nhn?_callback=window.__jindo2_callback._spellingCheck_0&q=${encodeURIComponent(text)}`;

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                // 네이버가 차단하지 않도록 Referer와 User-Agent를 명시합니다.
                'Referer': 'https://search.naver.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!apiResponse.ok) {
            throw new Error(`Naver API responded with ${apiResponse.status}`);
        }

        const responseText = await apiResponse.text();

        // 3. JSONP 콜백 래퍼(wrapper) 제거하기
        // 응답이 "window.__jindo2_callback._spellingCheck_0({ ... });" 형태로 오므로,
        // 앞뒤 껍데기를 제거하고 순수 JSON 객체만 추출합니다.
        const jsonStringMatch = responseText.match(/window\.__jindo2_callback\._spellingCheck_0\((.*)\);/s);
        
        if (!jsonStringMatch || !jsonStringMatch[1]) {
            throw new Error('Failed to parse JSONP response from Naver');
        }

        const jsonString = jsonStringMatch[1];
        const data = JSON.parse(jsonString);

        // 4. 파싱된 JSON에서 실제 결과 HTML을 추출하여 프론트엔드로 전송
        // data.message.result.html 안에 교정된 HTML이 들어있습니다.
        if (data && data.message && data.message.result) {
            response.status(200).json({ html: data.message.result.html });
        } else {
            throw new Error('Invalid response structure from Naver');
        }

    } catch (error) {
        console.error('Serverless function error:', error.message);
        response.status(500).json({ error: error.message });
    }
}
