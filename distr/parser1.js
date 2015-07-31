define(["require", "exports", './modules/lex/lexer'], function(require, exports, __lex__) {
    var lex = __lex__;
    
    

    var LR = lex.LexerRule;

    var lexer = new lex.Lexer();
    lexer.addRule(new LR(/^[_A-Za-z][_A-Za-z0-9]*/, 'ID'));
    lexer.addRule(new LR(/^[0-9]+/, 'INT', 0, parseInt));
    lexer.addRule(new LR(/^[0-9]*(\.[0-9]+)?([eE][\+\-][0-9]+)?/, 'FLOAT', 0, parseFloat));

    var advance = function (id) {
    };
});
