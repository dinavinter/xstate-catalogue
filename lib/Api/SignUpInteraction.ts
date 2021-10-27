
/**
 *
 * @export
 * @interface EmailSchema
 */
export interface EmailSchema extends IdentityEmail {
    /**
     *
     * @type {boolean}
     * @memberof EmailSchema
     */
    newsletter?: boolean;
    /**
     *
     * @type {boolean}
     * @memberof EmailSchema
     */
    deals?: boolean;
}
/**
 *
 * @export
 * @interface IdentityEmail
 */
export interface IdentityEmail {
    /**
     *
     * @type {IdentityemailIdentity}
     * @memberof IdentityEmail
     */
    identity?: IdentityemailIdentity;
}
/**
 *
 * @export
 * @interface IdentityPhone
 */
export interface IdentityPhone {
    /**
     *
     * @type {IdentityphoneIdentity}
     * @memberof IdentityPhone
     */
    identity?: IdentityphoneIdentity;
}
/**
 *
 * @export
 * @interface IdentityemailIdentity
 */
export interface IdentityemailIdentity {
    /**
     *
     * @type {string}
     * @memberof IdentityemailIdentity
     */
    email: string;
}
/**
 *
 * @export
 * @interface IdentityphoneIdentity
 */
export interface IdentityphoneIdentity {
    /**
     *
     * @type {string}
     * @memberof IdentityphoneIdentity
     */
    phonrnumber: string;
}

/**
 *
 * @export
 * @interface SmsSchema
 */
export interface SmsSchema extends IdentityPhone {
    /**
     *
     * @type {boolean}
     * @memberof SmsSchema
     */
    newsletter?: boolean;
}
