// /api/check.js
// [디버깅용] 네이버 응답을 로그로 출력하는 버전

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    const { text } = request.body;
    if (!text || text.trim() === "") {
        return response.status(200).json({ html: "" });
    }

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

        // --- 🕵️ 여기가 핵심 ---
        // Vercel 로그에 네이버가 보낸 원본 데이터를 출력합니다.
        console.log("--- NAVER RESPONSE START ---");
        console.log(responseText);
        console.log("--- NAVER RESPONSE END ---");
        // -------------------------

        const jsonStringMatch = responseText.match(/window\.__jindo2_callback\._spellingCheck_0\((.*)\);/s);
        
        if (!jsonStringMatch || !jsonStringMatch[1]) {
            console.warn('Could not parse Naver response, assuming no errors.');
            return response.status(200).json({ html: "" });
        }

        const jsonString = jsonStringMatch[1];
        const data = JSON.parse(jsonString);

        if (data && data.message && data.message.result) {
            response.status(200).json({ html: data.message.result.html });
        } else {
            console.warn('Invalid JSON structure from Naver.');
            response.status(200).json({ html: "" });
        }

    } catch (error) {
        console.error('Serverless function error (failing gracefully):', error.message);
        response.status(200).json({ html: "" });
    }
}
