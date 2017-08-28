$(document).ready(function(){
    // Detects enter key after input has focus.
    $( '#input').on( "keydown", function( event ) {
        // Gets user input value
        var input = $(' #input ').val();
        var query = {
            "text": input
        }
        if(input != '' && event.which == 13){
            startLoading();
            xhrGet('/myapp/api/v1/conversation?text='+input, function(result){
                var output = result;
                document.getElementById('input').value= '';
                $('#bot').html('<p class="flow-text">'+result+'</p>');
            },function(err){
                console.log(err);
            });
        }
    })
})


function startLoading(){
    $( '#bot' ).html('<img src="/images/loading.gif" width="40" height="40">');
}

function stopLoading(){
    $( '#bot' ).html('');
}