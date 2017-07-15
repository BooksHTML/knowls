/* 
 * Knowl - Feature Demo for Knowls
 * Copyright (C) 2011  Harald Schilly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * 4/11/2012 Modified by David Guichard to allow inline knowl code.
 * Sample use:
 *      This is an <a knowl="" class="internal" 
 *      value="Hello World!">inline knowl.</a>
 */

/*  8/14/14  Modified by David Farmer to allow knowl content to be
 *  taken from the element with a given id.
 *
 * The syntax is <a knowl="" class="id-ref" refid="proofSS">Proof</a>
 */
 
/* javascript code for the knowl features 
 * global counter, used to uniquely identify each knowl-output element
 * that's necessary because the same knowl could be referenced several times
 * on the same page */
var knowl_id_counter = 0;

var knowl_focus_stack_uid = [];
var knowl_focus_stack = [];
 
function knowl_click_handler($el) {
  // the knowl attribute holds the id of the knowl
  var knowl_id = $el.attr("knowl");
  // the uid is necessary if we want to reference the same content several times
  var uid = $el.attr("knowl-uid");
  var output_id = '#knowl-output-' + uid; 
  var $output_id = $(output_id);
  // create the element for the content, insert it after the one where the 
  // knowl element is included (e.g. inside a <h1> tag) (sibling in DOM)
  var idtag = "id='"+output_id.substring(1) + "'";
  var kid   = "id='kuid-"+ uid + "'";
  // if we already have the content, toggle visibility

  // Note that for tracking knowls, this setup is not optimal
  // because it applies to open knowls and also knowls which
  // were opened and then closed.
  if ($output_id.length > 0) {
     thisknowlid = "kuid-"+uid
     $("#kuid-"+uid).slideToggle("fast");
     this_knowl_focus_stack_uidindex = knowl_focus_stack_uid.indexOf(uid);
     
     if($el.hasClass("active")) {
       if(this_knowl_focus_stack_uidindex != -1) {
         knowl_focus_stack_uid.splice(this_knowl_focus_stack_uidindex, 1);
         knowl_focus_stack.splice(this_knowl_focus_stack_uidindex, 1);
       }
     }
     else {
         knowl_focus_stack_uid.push(uid);
         knowl_focus_stack.push($el);
         document.getElementById(thisknowlid).focus();
     }

     $el.toggleClass("active");
 
  // otherwise download it or get it from the cache
  } else { 
    var knowl = "<div class='knowl-output' "+kid+"><div class='knowl'><div class='knowl-content' " +idtag+ ">loading '"+knowl_id+"'</div><div class='knowl-footer'>"+knowl_id+"</div></div></div>";
    
    // check, if the knowl is inside a td or th in a table. otherwise assume its
    // properly sitting inside a <div> or <p>
    if($el.parent().is("td") || $el.parent().is("th") ) {
      // assume we are in a td or th tag, go 2 levels up
      var cols = $el.parent().parent().children().length;
      $el.parents().eq(1).after(
      // .parents().eq(1) was formerly written as .parent().parent()
          "<tr><td colspan='"+cols+"'>"+knowl+"</td></tr>");
    } else if ($el.parent().is("li")) {
      $el.parent().after(knowl);
    } 
    // the following is implemented stupidly, but I had to do it quickly.
    // someone please replace it with an appropriate loop -- DF
    // the '.is("p")' is for the first paragraph of a theorem or proof
    //also, after you close the knowl, it still has a shaded background
    else if ($el.parent().parent().is("li")) {
      $el.parent().parent().after(knowl);
    } 
    else if ($el.parent().css('display') == "block" || $el.parent().is("p") || $el.parent().hasClass("hidden-knowl-wrapper")) {
             $el.parent().after(knowl);
    } else if ($el.parent().parent().css('display') == "block" || $el.parent().parent().is("p") || $el.parent().parent().hasClass("hidden-knowl-wrapper")) {
             $el.parent().parent().after(knowl);
    } else {
     $el.parent().parent().parent().after(knowl);
    }
 
    // "select" where the output is and get a hold of it 
    var $output = $(output_id);
    var $knowl = $("#kuid-"+uid);
    $output.addClass("loading");
    $knowl.hide();
    // DRG: inline code
    if ($el.attr("class") == 'internal') {
      $output.html($el.attr("value"));
      $knowl.hide();
      $el.addClass("active");
      if(window.MathJax == undefined) {
            $knowl.slideDown("slow");
      }  else {
        $knowl.addClass("processing");
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, $output.get(0)]);
        MathJax.Hub.Queue([ function() { 
               	$knowl.removeClass("processing");
                $knowl.slideDown("slow"); 
}]);
      }
    } 
    else if ($el.attr("class") == 'id-ref') {
     //get content from element with the given id
      $output.html($("#".concat($el.attr("refid"))).html());
      $knowl.hide();
      $el.addClass("active");
      if(window.MathJax == undefined) {
            $knowl.slideDown("slow");
      }  else {
        $knowl.addClass("processing");
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, $output.get(0)]);
        MathJax.Hub.Queue([ function() { 
           $knowl.removeClass("processing");
           $knowl.slideDown("slow"); 
           var newid="#".concat($el.attr("refid")).concat(".knowl-output");
           $(newid).tabIndex=0;
           $(newid).focus();

           var thisknowlid = 'kuid-'.concat(uid)
           document.getElementById(thisknowlid).tabIndex=0;
           document.getElementById(thisknowlid).focus();
           knowl_focus_stack_uid.push(uid);
           knowl_focus_stack.push($el);
           $("a[knowl]").attr("href", "");
}]);
      }
    }
    else {
    // Get code from server.
    $output.load(knowl_id,
     function(response, status, xhr) { 
      $knowl.removeClass("loading");
      if (status == "error") {
        $el.removeClass("active");
        $output.html("<div class='knowl-output error'>ERROR: " + xhr.status + " " + xhr.statusText + '</div>');
        $output.show();
      } else if (status == "timeout") {
        $el.removeClass("active");
        $output.html("<div class='knowl-output error'>ERROR: timeout. " + xhr.status + " " + xhr.statusText + '</div>');
        $output.show();
      } else {
        $knowl.hide();
        $el.addClass("active");
      }
      // if we are using MathJax, then we reveal the knowl after it has finished rendering the contents
      if(window.MathJax == undefined) {
            $knowl.slideDown("slow");
      }  else {
        $knowl.addClass("processing");
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, $output.get(0)]);
        MathJax.Hub.Queue([ function() { 
           $knowl.removeClass("processing");
           $knowl.slideDown("slow"); 
           var thisknowlid = 'kuid-'.concat(uid)
           document.getElementById(thisknowlid).tabIndex=0;
           document.getElementById(thisknowlid).focus();
           knowl_focus_stack_uid.push(uid);
           knowl_focus_stack.push($el);
           $("a[knowl]").attr("href", "");
       }]);
      }
     }); 
    }
  }
} //~~ end click handler for *[knowl] elements

/** register a click handler for each element with the knowl attribute 
 * @see jquery's doc about 'live'! the handler function does the 
 *  download/show/hide magic. also add a unique ID, 
 *  necessary when the same reference is used several times. */
$(function() {
    $("body").on("click", "*[knowl]", function(evt) {
      evt.preventDefault();
      var $knowl = $(this);
      if(!$knowl.attr("knowl-uid")) {
        $knowl.attr("knowl-uid", knowl_id_counter);
        knowl_id_counter++;
      }
      knowl_click_handler($knowl, evt);
  });
});


$(window).load(function() {
   $("a[knowl]").attr("href", "");
});

window.onload = function()
{
    document.onkeyup = function(event)
    {
        var e = (!event) ? window.event : event;
        switch(e.keyCode)
        {
            case 27: //u        
                if(knowl_focus_stack.length > 0 ) {
                  most_recently_opened = knowl_focus_stack.pop();
                  knowl_focus_stack_uid.pop();
                  most_recently_opened.focus();
                  }
                else {
                  console.log("no open knowls being tracked");
            break;
        }
};
};
};


