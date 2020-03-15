
var pcEl = document.getElementsByTagName("INPUT");

function pcRuleStatus() {
    for (var i = 0; i < pcEl.length; i++) {
        if (pcEl[i].id=="Enable1:ParentCtrl:0") {
            document.body.innerHTML+='<div id="pcRuleStatus">'+(pcEl[i].checked?'1':'0')+'</div>';
            break;
        }
    }
}

function pcRuleOn() {

    for (var i = 0; i < pcEl.length; i++) {
        if (pcEl[i].id=="Enable1:ParentCtrl:0") {
            pcEl[i].click();
            break;
        }
    }

}

function pcRuleOff() {

    for (var i = 0; i < pcEl.length; i++) {
        if (pcEl[i].id=="Enable0:ParentCtrl:0") {
            pcEl[i].click();
            break;
        }
    }

}
