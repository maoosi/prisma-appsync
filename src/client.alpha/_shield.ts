import { ShieldDirectives, ShieldSubject, ShieldDirectiveParam, ShieldDirectivePossibleTypes } from './defs'


/**
 * Return a ShieldDirective for a given param (`rule`, `filter`, `afterResolve`, ...) based on an input Shield and ShieldSubject.
 * @param  {Shield} shield
 * @param  {ShieldSubject} subject
 * @param  {ShieldDirectiveParam} param
 * @returns ShieldDirective
 */
export function getDirectiveParam(
    shield:ShieldDirectives, subject:ShieldSubject, param:ShieldDirectiveParam
): ShieldDirectivePossibleTypes {
    let directiveParam:any = null

    // find rule from [custom.string.param]
    if (
        typeof subject.model !== 'undefined' &&
        subject.model === 'custom' && 
        typeof shield['custom'] !== 'undefined' && 
        typeof shield['custom'][subject.actionAlias] !== 'undefined' && 
        typeof shield['custom'][subject.actionAlias][param] !== 'undefined'
    ) {
        directiveParam = shield['custom'][subject.actionAlias][param]
    }
    // find rule from [custom.param]
    else if (
        typeof subject.model !== 'undefined' &&
        subject.model === 'custom' && 
        typeof shield['custom'] !== 'undefined' && 
        typeof shield['custom'][param] !== 'undefined'
    ) {
        directiveParam = shield['custom'][param]
    }
    // find rule from [model.action.param]
    else if (
        typeof subject.model !== 'undefined' &&
        subject.model !== 'custom' &&
        typeof subject.actionAlias !== 'undefined' &&
        typeof shield[subject.model] !== 'undefined' && 
        typeof shield[subject.model][subject.actionAlias] !== 'undefined' &&
        typeof shield[subject.model][subject.actionAlias][param] !== 'undefined'
    ) {
        directiveParam = shield[subject.model][subject.actionAlias][param]
    }
    // find rule from [model.param]
    else if (
        typeof subject.model !== 'undefined' &&
        subject.model !== 'custom' &&
        typeof subject.model !== 'undefined' &&
        typeof shield[subject.model] !== 'undefined' && 
        typeof shield[subject.model][param] !== 'undefined'
    ) {
        directiveParam = shield[subject.model][param]
    }
    // find rule from [*.actionAlias.param]
    else if (
        typeof subject.model !== 'undefined' &&
        subject.model !== 'custom' &&
        typeof subject.actionAlias !== 'undefined' &&
        typeof shield['*'][subject.actionAlias] !== 'undefined' && 
        typeof shield['*'][subject.actionAlias][param] !== 'undefined'
    ) {
        directiveParam = shield['*'][subject.actionAlias][param]
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