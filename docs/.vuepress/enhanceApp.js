import { findPageForPath } from '@app/util'

export default ({
    Vue
}) => {
    Vue.mixin({
        methods: {
            getPageKey(pages, path) {
                const result = findPageForPath(pages, path)
                return result.key
            }
        }
    })
}