// /api/check.js
// [최종] Daum API 주소를 alldic으로 수정한 버전

export default async function handler(request, response) {
    // 1. POST 요청이 아니면 거부
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // 2. 프론트엔드에서 보낸 텍스트 받기
    const { text } = request.body;
    if (!text || text.trim() === "") {
        // 텍스트가 비어있으면 오류 없음(빈 배열)을 반환
        return response.status(200).json([]); 
    }

    // 3. '다음' API의 새 주소 (alldic)
    const apiUrl = `https://alldic.daum.net/grammar_checker.daum?q=${encodeURIComponent(text)}`;

    try {
        // 4. '다음' API에 검사 요청
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                // 'alldic'을 사용하는 Referer로 변경
                'Referer': 'https://alldic.daum.net/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // 5. '다음'이 404 등 에러를 반환했는지 확인
        if (!apiResponse.ok) {
            // Vercel 로그에 "Daum API responded with 404"가 찍힘
            throw new Error(`Daum API responded with ${apiResponse.status}`);
        }

        // 6. 정상 응답이면 JSON 데이터 추출
        const data = await apiResponse.json(); 
        
        // 7. JSON 데이터를 프론트엔드로 그대로 전달
        response.status(200).json(data);

    } catch (error) {
        // 5번(fetch 실패) 또는 6번(json 파싱 실패)에서 에러 발생 시
        console.error('Daum API fetch error:', error.message);
        
        // 프론트엔드가 500 에러를 받지 않도록,
        // "오류 없음(빈 배열)"으로 정상 응답(200)을 보냄
        response.status(200).json([]);
    }
}
