/**
 * Created by mlavigne on 23/11/2015.
 */

/** Dossier de la Dropbox par rapport aux projets ALS */
var pathMatcher = new PathMatcher([
    new PathMatching('/Users/bludwarf/Dropbox', 'D:\\Dropbox')
]);

als.pathMatcher = pathMatcher;