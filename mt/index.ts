// This file is auto-generated, don't edit it
import alimt20181012, * as $alimt20181012 from '@alicloud/alimt20181012'
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
import * as $OpenApi from '@alicloud/openapi-client'
// import * as $tea from '@alicloud/tea-typescript';


export default class Client {
    client: alimt20181012

    /**
     * 使用AK&SK初始化账号Client
     * @param accessKeyId
     * @param accessKeySecret
     * @return Client
     * @throws Exception
     */
    constructor({ accessKeyId, accessKeySecret }) {
        const config = new $OpenApi.Config({
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret,
        })
        // 访问的域名
        config.endpoint = `mt.cn-hangzhou.aliyuncs.com`
        this.client = new alimt20181012(config)
    }

    async translateGeneral({
        text,
        from,
        to
    }) {
        const translateGeneralRequest = new $alimt20181012.TranslateGeneralRequest({
            formatType: "text",
            sourceText: text,
            scene: "general",
            sourceLanguage: from,
            targetLanguage: to
        })
        // const runtime = new $Util.RuntimeOptions({})
        try {
            // 复制代码运行请自行打印 API 的返回值
            const result = await this.client.translateGeneral(translateGeneralRequest)
            return result
        } catch (error) {
            // 如有需要，请打印 error
            console.error(error)
            // Util.assertAsString(error.message)
        }
    }
}