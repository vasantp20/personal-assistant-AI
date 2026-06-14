import dateFormat, { masks } from "dateformat";

export function getStringFromDate(fromDateStr) {
    let dateObj = new Date(fromDateStr)
    let datestring = dateFormat(dateObj, "dd-mm-yyyy");
    return datestring

}

export function getStringFromDateYYYmmdd(fromDateStr) {
    let dateObj = new Date(fromDateStr)
    let datestring = dateFormat(dateObj, "yyyy-mm-dd");
    return datestring

}

export function isDateLessThanToday(fromDateStr) {
    let dateObj = new Date(fromDateStr)
    let todayDate = new Date()
    if(dateObj < todayDate) {
        return true
    } else {
        return false
    }
}
