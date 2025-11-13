// /api/check.js
// [최종] Daum API 주소를 alldic으로 수정한 버전

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    const { text } = request.body;
    if (!text || text.trim() === "") {
        return response.status(200).json([]); 
    }

    // --- 여기가 수정되었습니다! ---
    // 'dic.daum.net' (404 발생) -> 'alldic.daum.net' (새 주소)
    const apiUrl = `https://alldic.daum.net/grammar_checker.daum?q=${encodeURIComponent(text)}`;
    // ---------------------------------

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://alldic.daum.net/' // Referer도 alldic으로 변경
            }
        });

        if (!apiResponse.ok) {
            // 여기서 404가 또 뜬다면 이 주소도 죽은 것입니다.
            throw new Error(`Daum API responded with ${apiResponse.status}`);
        }

        const data = await apiResponse.json(); 
        
        response.status(200).json(data);

    } catch (error) {
        console.error('Daum API fetch error:', error.message);
        response.status(200).json([]);
    }
}
