import { Shield, ShieldSubject, ShieldDirective, ShieldDirectiveParam} from './defs'

export function getDirectiveParam(
    shield:Shield, subject:ShieldSubject, param:ShieldDirectiveParam
): ShieldDirective|null {
    let directiveParam:any = null

    // find rule from [custom.string.param]
    if (
        typeof subject === 'string' && 
        typeof shield['custom'] !== 'undefined' && 
        typeof shield['custom'][subject] !== 'undefined' && 
        typeof shield['custom'][subject][param] !== 'undefined'
    ) {
        directiveParam = shield['custom'][subject][param]
    }
    // find rule from [model.action.param]
    else if (
        typeof subject !== 'string' && 
        typeof subject.model !== 'undefined' &&
        typeof subject.action !== 'undefined' &&
        typeof shield[subject.model] !== 'undefined' && 
        typeof shield[subject.model][subject.action] !== 'undefined' &&
        typeof shield[subject.model][subject.action][param] !== 'undefined'
    ) {
        directiveParam = shield[subject.model][subject.action][param]
    }
    // find rule from [model.param]
    else if (
        typeof subject !== 'string' && 
        typeof subject.model !== 'undefined' &&
        typeof shield[subject.model] !== 'undefined' && 
        typeof shield[subject.model][param] !== 'undefined'
    ) {
        directiveParam = shield[subject.model][param]
    }
    // find rule from [*.action.param]
    else if (
        typeof subject !== 'string' && 
        typeof subject.action !== 'undefined' &&
        typeof shield['*'][subject.action] !== 'undefined' && 
        typeof shield['*'][subject.action][param] !== 'undefined'
    ) {
        directiveParam = shield['*'][subject.action][param]
    }
    // find rule from [*.param]
    else if (
        typeof shield['*'] !== 'undefined' && 
        typeof shield['*'][param] !== 'undefined'
    ) {
        directiveParam = shield['*'][param]
    }

    return directiveParam
}