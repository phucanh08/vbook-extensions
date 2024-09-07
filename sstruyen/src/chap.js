async function execute(url) {
    let response = await fetch(url);
    if (response.ok) {
        let html = await response.text()
        console.log('html')
        // Loại bỏ các thẻ iframe và ins
        html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '').replace(/<ins[^>]*>[\s\S]*?<\/ins>/gi, '');                    

        // Trích xuất nội dung từ div có class "content container1"
        let contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*container1[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (contentMatch) {
            return contentMatch[1].trim();
        } else {
            return "Không tìm thấy nội dung";
        }
    }

    return null;
}