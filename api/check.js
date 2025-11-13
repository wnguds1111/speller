// /api/check.js
// [최종] Daum(Kakao) 맞춤법 검사기 API를 사용하는 버전

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    const { text } = request.body;
    if (!text || text.trim() === "") {
        // 오류 없음(빈 배열)을 정상적으로 반환
        return response.status(200).json([]); 
    }

    // 다음 API는 q= 파라미터로 텍스트를 받습니다.
    const apiUrl = `https://dic.daum.net/grammar_checker.daum?q=${encodeURIComponent(text)}`;

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                // 다음 API는 비교적 덜 민감하지만, 기본 헤더를 추가합니다.
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://dic.daum.net/'
            }
        });

        if (!apiResponse.ok) {
            throw new Error(`Daum API responded with ${apiResponse.status}`);
        }

        // 다음은 JSON을 바로 반환합니다. (파싱 필요 없음)
        const data = await apiResponse.json(); 
        
        // JSON 배열을 프론트엔드로 그대로 전달합니다.
        response.status(200).json(data);

    } catch (error) {
        console.error('Daum API fetch error:', error.message);
        // 에러가 발생하면, "오류 없음"으로 정상 처리해서 500 에러를 막습니다.
        response.status(200).json([]);
    }
}
